const eventStoreManager = require('../eventStore');
const eventStore = eventStoreManager.getES();
const esCredentials = eventStoreManager.getCredentials();
const eventStoreClient = require('event-store-client');

const streamID = "agenda";

function postEvent(content, type) {
    const event = {
        eventId: eventStoreManager.getNewID(),
        eventType: type,
        data: content
    };
    write("agenda", [event]);
}

function write(streamID, eventsArray) {
    // todo promise, catch etc for the http request response
    eventStore.writeEvents(streamID, eventStoreManager.getExpectedVersion(), false, eventsArray, esCredentials, completed => {
        console.log("Event written result: " + eventStoreClient.OperationResult.getName(completed.result));
    });
}

module.exports = {postEvent};

