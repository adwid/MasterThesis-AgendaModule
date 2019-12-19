const activityField = ["@context", "type", "actor", "object", "to"];
const nonActivityFields = ["@context", "type", "to", "attributedTo", "content", "mediaType"];
const agendaFields = ["name", "description", "dates"];
const uuid = require('uuid/v1');

function generateCreateAgendaActivity(request) {
    let activity = undefined;
    if (!request) return undefined;
    if (request.type === 'Note' && isValidAgendaNote(request)) {
        activity = agendaNoteToCreateActivity(request);
    }
    if (request.type === 'Create' && isValidCreateAgendaActivity(request)) {
        activity = request;
    }
    if (!activity) return undefined;
    activity.published = (new Date()).toISOString();
    activity.object.id = uuid(); //todo
    activity.id = uuid(); //todo
    return activity;
}

function isValidCreateAgendaActivity(activity) {
    if (!activityField.every(field => activity.hasOwnProperty(field))
        || activity.type !== "Create"
        || !isValidAgendaNote(activity.object)
    ) return false;
    return true;
}

function isValidAgendaNote(note) {
    if (!nonActivityFields.every(field => note.hasOwnProperty(field))
        || !agendaFields.every(field => note.content.hasOwnProperty(field))
        || note.type !== 'Note'
        || note.mediaType !== 'application/json'
        || !isDatesArray(note.content.dates)
    ) return false;
    return true;
}

function isDatesArray(array) {
    if (!Array.isArray(array)) return false;
    return array.length > 0 && array.every(date => isIsoDate(date));
}

function isIsoDate(str) {
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
    var d = new Date(str);
    return d.toISOString()===str;
}

function agendaNoteToCreateActivity(note) {
    const activity = {
        "@context": "https://www.w3.org/ns/activitystreams",
        "type": "Create",
        "actor": note.attributedTo,
        "to": note.to,
        "object": note
    };

    return isValidCreateAgendaActivity(activity) ? activity : undefined;
}

module.exports = {
    generateCreateAgendaActivity
};

