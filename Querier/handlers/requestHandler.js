const actorHandler = require("./actorHandler");
const axios = require('axios');

function forwardObjectToInboxes(dbObject, isCreated) {
    const activity = objectToActivity(dbObject, isCreated);
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
    let url = addr.match(regExp) ? "http://" + process.env.HOST + ":" + process.env.AGENDA_INBOX_PORT : recipient.data.inbox;
    return url + "/agenda/message"
}

function objectToActivity(object, isCreated) {
    const secretary = "http://10.42.0.1:" + process.env.AGENDA_QUERIER_PORT; // TODO CREATE AN ACTOR FOR THE AGENDA MODULE
    const to = [];
    const id = object._id;
    object["_id"] = undefined;
    object["__v"] = undefined;
    for (let participant of object.participants) to.push(participant.id);
    let activity = {
        "@context": "https://www.w3.org/ns/activitystreams",
        "id": id,
        "type": isCreated ? "Create" : "Update",
        "to": to,
        "actor": secretary,
        "object": {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": "Note",
            "mediaType": "application/json",
            "attributedTo": secretary,
            "to": to,
            "content": object
        }
    };
    if (!isCreated) activity["updated"] = (new Date()).toISOString();
    return activity
}

module.exports = {
    forwardObjectToInboxes,
};
