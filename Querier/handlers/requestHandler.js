const actorHandler = require("./actorHandler");
const axios = require('axios');
const { v1: uuid } = require('uuid');

function forwardObjectToInboxes(dbObject, type) {
    const activity = objectToActivity(dbObject, type);
    const promises = [];

    return actorHandler.getInboxAddresses(activity.to)
        .then(inboxes => {
            for (let inbox of inboxes) promises.push(
                axios.post(convertAddress(inbox), activity)
                    .catch(err => console.log("Err while forwarding to " + inbox + " : " + err))
            );

            return Promise.all(promises);
        });
}

function convertAddress(addr) {
    let regExp = /https?:\/\/([0-9]{1,3}\.){3,3}[0-9]:[0-9]+(\/inbox)?\/([A-Z]*[a-z]*[0-9]*)+/gi;
    let url = addr.match(regExp) ? process.env.PREFIX + process.env.HOST + ":" + process.env.AGENDA_INBOX_PORT : recipient.data.inbox;
    return url + "/agenda/message"
}

function objectToActivity(object, type) {
    const secretary = process.env.PREFIX + process.env.HOST + ":" + process.env.AGENDA_QUERIER_PORT + '/agenda/secretary';
    const to = [];
    for (let participant of object.participants) to.push(participant.id);
    let activity = {
        "@context": "https://www.w3.org/ns/activitystreams",
        "id": process.env.PREFIX + process.env.HOST + ":" + process.env.AGENDA_QUERIER_PORT + "/agenda/" + uuid(),
        "type": "Create",
        "to": to,
        "actor": secretary,
        "object": {
            "@context": "https://www.w3.org/ns/activitystreams",
            "id": process.env.PREFIX + process.env.HOST + ":" + process.env.AGENDA_QUERIER_PORT + "/agenda/" + uuid(),
            "type": "Note",
            "mediaType": "application/json",
            "attributedTo": secretary,
            "to": to,
            "content": {
                "url": object._id,
                "type": type
            }
        }
    };
    return activity
}

module.exports = {
    forwardObjectToInboxes,
};
