const esClient = require('../eventStore').getClient();
const db = require('./dbHandler');

const streamId = "agenda";
const eventCallback = new Map();

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
