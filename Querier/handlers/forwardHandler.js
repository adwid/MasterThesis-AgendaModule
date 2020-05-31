const { v1: uuid } = require('uuid');
const axios = require('axios');
const actorHandler = require('./actorHandler');

function forwardErrorMessage(actor, rideID, type, message) {
    send(actor, {
        "url": rideID,
        "type": "error",
        "error": type + ":::" + message,
    }).then(_ => {
        console.log("Event \'" + type + "\': user's error detected and handled");
    });
}

function forwardAgendaCreation(type, from, dbObject) {
    const participants = dbObject.participants.map(participant => participant.id);
    return Promise.all([
        send(participants[0], {"url": dbObject._id, "from":from, "type": "create"}),
        sendMany(participants.slice(1), {"url": dbObject._id, "from":from, "type": "created"}),
    ])
}

function send(actor, content) {
    console.log(actor);
    const activity = objectToActivity(actor, content);
    return actorHandler.getInboxAddresses(actor)
        .then(addr => {
            if (addr.length === 0) return Promise.reject("(send) no inbox addr found.");
            return axios.post(addr[0], activity)
        })
        .catch(err => {
            console.error("[ERR] unable to send message (" + addr +") ; " + err )
            return Promise.resolve();
        });
}

function sendMany(actors, content) {
    const promises = [];
    for (const actor of actors)
        promises.push(send(actor, content));
    return Promise.all(promises);
}

function objectToActivity(to, content) {
    const secretary = process.env.PREFIX + process.env.HOST + ":" + process.env.CARPOOLING_QUERIER_PORT + '/carpooling/secretary';
    return {
        "@context": "https://www.w3.org/ns/activitystreams",
        "id": process.env.PREFIX + process.env.HOST + ":" + process.env.CARPOOLING_QUERIER_PORT + "/carpooling/" + uuid(),
        "type": "Create",
        "to": to,
        "actor": secretary,
        "published": (new Date()).toISOString(),
        "object": {
            "@context": "https://www.w3.org/ns/activitystreams",
            "id": process.env.PREFIX + process.env.HOST + ":" + process.env.CARPOOLING_QUERIER_PORT + "/carpooling/" + uuid(),
            "type": "Note",
            "mediaType": "application/json",
            "attributedTo": secretary,
            "to": to,
            "content": content,
        }
    }
}

module.exports = {
    forwardErrorMessage,
    forwardToOrganizer: forwardAgendaCreation,
};
