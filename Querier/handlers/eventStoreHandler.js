const eventStoreManager = require('../eventStore');
const eventStore = eventStoreManager.getES();
const credentials = eventStoreManager.getCredentials();

const streamId = "agenda";
console.log('Subscribing to ' + streamId + "...");
var correlationId = eventStore.subscribeToStream(streamId, true, function(streamEvent) {
    console.log(streamEvent);
}, onSubscriptionConfirmed, undefined, credentials, undefined);

function onSubscriptionConfirmed(confirmation) {
    console.log("Subscription confirmed (last commit " + confirmation.lastCommitPosition + ", last event " + confirmation.lastEventNumber + ")");
}
