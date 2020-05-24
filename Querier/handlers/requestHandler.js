const actorHandler = require("./actorHandler");
const axios = require('axios');
const { v1: uuid } = require('uuid');

function forwardObjectToInboxes(dbObject, type) {
    const activity = objectToActivity(dbObject, type);
    const promises = [];

    return actorHandler.getInboxAddresses(activity.to)
        .then(inboxes => {
            for (let inbox of inboxes) promises.push(
                axios.post(inbox, activity)
                    .catch(err => console.log("Err while forwarding to " + inbox + " : " + err))
            );

            return Promise.all(promises);
        });
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
        "published": (new Date()).toISOString(),
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
