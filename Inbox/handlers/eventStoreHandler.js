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
    console.log(event)
    eventStore.writeEvents(streamID, eventStoreManager.getExpectedVersion(), false, [event], esCredentials, completed => {
        console.log("Event written result: " + eventStoreClient.OperationResult.getName(completed.result));
    });
}

module.exports = {postNewAgenda};

