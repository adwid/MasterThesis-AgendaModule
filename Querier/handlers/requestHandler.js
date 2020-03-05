const axios = require('axios');

function forwardObjectToInboxes(dbObject, isCreated) {
    const activity = objectToActivity(dbObject, isCreated);
    const promises = [];

    for (let recipient of activity.to) {
        promises.push(
            axios.post(
                "http://10.42.0.1:" + process.env.AGENDA_INBOX_PORT + "/agenda/message",
                activity
            ).
            catch(err => console.log("Err while forwarding to " + recipient + " : " + err))
        );
    }

    return Promise.all(promises);
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
