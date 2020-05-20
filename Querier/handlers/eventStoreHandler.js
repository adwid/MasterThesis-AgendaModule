const esClient = require('../eventStore');
const db = require('./dbHandler');
const axios = require('axios');
const projHandler = require('./projectionHandler');
const request = require('./requestHandler');

let isProjectionInitialized = false;
const streamId = "agenda";
const projectionName = "projectionUsedByAgendaQuerier";
const esConnection = esClient.connection();
const esCredentials = esClient.getCredentials();

const eventCallback = {
    'create':   {dbCallback: db.createNewAgenda,    mustBeForwarded: true},
    'vote':     {dbCallback: db.applyVote,          mustBeForwarded: false},
    'withdraw': {dbCallback: db.withdrawVote,       mustBeForwarded: false},
    'close':    {dbCallback: db.closeAgenda,        mustBeForwarded: true},
    'open':     {dbCallback: db.openAgenda,         mustBeForwarded: true},
    'reset':    {dbCallback: db.resetAgenda,        mustBeForwarded: true},
};

esConnection.subscribeToStream(streamId, false, onNewEvent)
    .then(_ => {
        console.log("Subscription confirmed (stream %s)", streamId);
    })
    .catch(err => {
        console.error("[ERR] error with stream subscription (stream %s) : %s", streamId, err);
        process.exit(1);
    });

initProjection()
    .catch(err => console.error("[ERR] ES : can not initialize the projection : " + err));

function onNewEvent(sub, event) {
    const eventType = event.originalEvent.eventType;
    const activity = JSON.parse(event.originalEvent.data);
    if (eventType === "message") {
        db.storeMessage(activity.object).then(_ => {
            console.log("Message received and available to the recipient(s) !");
        }).catch(err => console.error("[ERR] storeMessage err ; " + err));
        return;
    }
    if (!eventCallback.hasOwnProperty(eventType)) {
        console.error("[ERR] ES : unkown event's type : " + eventType);
        return;
    }
    var updateDB = eventCallback[eventType].dbCallback;
    updateDB(activity.object) // Pass the note object of the activity and store it to DB
        .then(objectSaved => {
            if (!objectSaved) return Promise.resolve();
            console.log("Event " + eventType + ": DB updated");
            if (eventCallback[eventType].mustBeForwarded) {
                return request.forwardObjectToInboxes(objectSaved, eventType)
            }
            return Promise.resolve();
        })
        .catch(err => console.log("" + err));
}

function initProjection() {
    const body = "options({})\n" +
        "\n" +
        "fromStream('doesNotExist" + Date.now() + "')";
    // todo extract URL (in eventStore.js ?)
    return axios.post("http://eventstore:2113/projections/onetime?name="
        + projectionName + "&type=JS&enabled=true&checkpoints=false&emit=false&trackemittedstreams=false",
        body, {auth: esCredentials})
        .catch(err => {
            // If the projection already exists (409 -> conflict), it's ok
            if (err.response !== undefined && err.response.status === 409) return Promise.resolve();
            isProjectionInitialized = false;
            return Promise.reject(err);
        })
        .then(_ => {
            console.log("EventStore : projection initialized");
            isProjectionInitialized = true;
        });
}

function getSpecificObject(id) {
    const projection = projHandler.generateGetObjectQuery(id);
    return runProjection(projection);
}

function getActivitiesFromActor(actor) {
    const projection = projHandler.generateGetActorActivitiesQuery(actor);
    return runProjection(projection);
}

function getActivitiesToActor(recipient) {
    const projection = projHandler.generateGetRecipientActivitiesQuery(recipient);
    return runProjection(projection);
}

function runProjection(projection) {
    let initializeProjection = Promise.resolve();
    if (!isProjectionInitialized) initializeProjection = initProjection();
    return initializeProjection
        .catch(err => {
            return Promise.reject("can not initialize the projection : " + err);
        })
        .then(_ => {
            return axios.put("http://eventStore:2113/projection/" + projectionName + "/query?type=JS&emit=false",
                projection, {auth: esCredentials});
        })
        .then(_ => {
            return axios.get("http://eventStore:2113/projection/" + projectionName + "/result", {auth: esCredentials});
        })
        .then(response => {
            return Promise.resolve(response.data);
        });
}

module.exports = {
    getActivitiesFromActor,
    getActivitiesToActor,
    getSpecificObject,
};
