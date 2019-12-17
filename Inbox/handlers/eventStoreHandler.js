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
    if (type === "newAgenda") {
        event.data.agendaID = content.id;
        delete event.data.id;
    }
    return write("agenda", [event]);
}

function write(streamID, eventsArray) {
    return new Promise((resolve, reject) => {
        eventStore.writeEvents(streamID, eventStoreManager.getExpectedVersion(), false, eventsArray, esCredentials, completed => {
            console.log("Event written result: " + eventStoreClient.OperationResult.getName(completed.result));
            if (completed.result === eventStoreClient.OperationResult.Success) resolve();
            else reject();
        });
    });}

module.exports = {postEvent};

