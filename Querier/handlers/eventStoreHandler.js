const esClient = require('../eventStore').getClient();
const db = require('./dbHandler');
const axios = require('axios');

let isProjectionInitialized = false;
const streamId = "agenda";
const eventCallback = new Map();
const projectionName = "projectionUsedByAgendaQuerier";
const esCredentials = {
    username: "admin",
    password: "changeit"
};

eventCallback.set('agenda', db.createNewAgenda);
eventCallback.set('vote', db.applyVote);
eventCallback.set('withdraw', db.withdrawVote);
eventCallback.set('close', db.closeAgenda);
eventCallback.set('open', db.openAgenda);
eventCallback.set('reset', db.resetAgenda);

esClient.subscribeToStream(streamId, false, onNewEvent)
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
    if (!eventCallback.has(eventType)) {
        console.error("[ERR] ES : unkown event's type : " + streamEvent.eventType);
        return;
    }
    var callback = eventCallback.get(eventType);
    callback(activity.object) // Pass the note object of the activity
        .then(_ => console.log("Event " + eventType + " stored !"))
        .catch(err => console.error("[ERR] database : " + err));
}

function initProjection() {
    const body = "options({})\n" +
        "\n" +
        "fromStream('doesNotExist" + Date.now() + "')";
    return axios.post("http://127.0.0.1:2113/projections/onetime?name="
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
    const projection = generateProjectionQuery(id);
    let initializeProjection = Promise.resolve();
    if (!isProjectionInitialized) initializeProjection = initProjection();
    return initializeProjection
        .catch(err => {
            return Promise.reject("can not initialize the projection : " + err);
        })
        .then(_ => {
            return axios.put("http://127.0.0.1:2113/projection/" + projectionName + "/query?type=JS&emit=false",
                projection, {auth: esCredentials});
        })
        .then(_ => {
            return axios.get("http://127.0.0.1:2113/projection/" + projectionName + "/result", {auth: esCredentials});
        })
        .then(response => {
            return Promise.resolve(response.data);
        });
}

function generateProjectionQuery(id) {
    return "options({\n" +
        "    $includeLinks: false,\n" +
        "    reorderEvents: false,\n" +
        "    processingLag: 0\n" +
        "})\n" +
        "\n" +
        "fromStream('agenda')\n" +
        ".when({\n" +
        "    $init:function(){\n" +
        "        return {\n" +
        "            count: 0\n" +
        "        }\n" +
        "    },\n" +
        "    $any: function(state, event){\n" +
        "        if (event.data !== undefined) {\n" +
        "            if (event.data.id === \"" + id + "\" \n" +
        "            || (event.data.object !== undefined && event.data.object.id === \"" + id + "\")) {\n" +
        "                state.count++;\n" +
        "                state.activity = event.data;\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "})";
}

module.exports = {
    getSpecificObject
};
