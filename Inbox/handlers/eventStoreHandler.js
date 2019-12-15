const eventStoreManager = require('../eventStore');
const eventStore = eventStoreManager.getES();
const esCredentials = eventStoreManager.getCredentials();
const eventStoreClient = require('event-store-client');

const streamID = "agenda";

function postNewAgenda(agenda) {
    const event = {
        eventId: eventStoreManager.getNewID(),
        eventType: 'newAgenda',
        data: agenda
    };
    write("agenda", [event]);
}

function write(streamID, eventsArray) {
    eventStore.writeEvents(streamID, eventStoreManager.getExpectedVersion(), false, eventsArray, esCredentials, completed => {
        console.log("Event written result: " + eventStoreClient.OperationResult.getName(completed.result));
    });
}

module.exports = {postNewAgenda};

