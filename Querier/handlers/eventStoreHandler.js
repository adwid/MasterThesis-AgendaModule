const eventStoreManager = require('../eventStore');
const eventStore = eventStoreManager.getES();
const credentials = eventStoreManager.getCredentials();
const db = require('./dbHandler');

const streamId = "agenda";
const eventCallback = new Map();

eventCallback.set('newAgenda', writeNewAgenda);
eventCallback.set('vote', applyVote);
eventCallback.set('withdraw', withdrawVote);

console.log('Subscribing to ' + streamId + "...");
eventStore.subscribeToStream(streamId, true, function(streamEvent) {
    if (!eventCallback.has(streamEvent.eventType)) {
        console.error("[ERR] ES : unkown event's type : " + streamEvent.eventType);
        return;
    }
    var callback = eventCallback.get(streamEvent.eventType);
    callback(streamEvent.data);
}, onSubscriptionConfirmed, undefined, credentials, undefined);

function writeNewAgenda(newAgenda) {
    db.createNewAgenda(newAgenda)
        .then(res => console.log("New agenda stored !"))
        .catch(err => console.error("[ERR] database : " + err));
}

function applyVote(vote) {
    db.applyVote(vote)
        .then(res => console.log("New vote computed !"))
        .catch(err => console.error("[ERR] database : " + err));
}

function withdrawVote(withdrawing) {
    db.withdrawVote(withdrawing)
        .then(res => console.log("Vote withdrew !"))
        .catch(err => console.error("[ERR] database : " + err));
}

function onSubscriptionConfirmed(confirmation) {
    console.log("Subscription confirmed (last commit " + confirmation.lastCommitPosition + ", last event " + confirmation.lastEventNumber + ")");
}
