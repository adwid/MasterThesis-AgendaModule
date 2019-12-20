const eventStoreManager = require('../eventStore');
const eventStore = eventStoreManager.getES();
const credentials = eventStoreManager.getCredentials();
const db = require('./dbHandler');

const streamId = "agenda";
const eventCallback = new Map();

eventCallback.set('newAgenda', db.createNewAgenda);
eventCallback.set('vote', db.applyVote);
eventCallback.set('withdraw', db.withdrawVote);
eventCallback.set('close', db.closeAgenda);
eventCallback.set('open', db.openAgenda);

console.log('Subscribing to ' + streamId + "...");
eventStore.subscribeToStream(streamId, true, function(streamEvent) {
    if (!eventCallback.has(streamEvent.eventType)) {
        console.error("[ERR] ES : unkown event's type : " + streamEvent.eventType);
        return;
    }

    var callback = eventCallback.get(streamEvent.eventType);

    callback(streamEvent.data.object) // Pass the note object of the activity
        .then(_ => console.log("Event " + streamEvent.eventType + " stored !"))
        .catch(err => console.error("[ERR] database : " + err));

}, onSubscriptionConfirmed, undefined, credentials, undefined);

function onSubscriptionConfirmed(confirmation) {
    console.log("Subscription confirmed (last commit " + confirmation.lastCommitPosition + ", last event " + confirmation.lastEventNumber + ")");
}
