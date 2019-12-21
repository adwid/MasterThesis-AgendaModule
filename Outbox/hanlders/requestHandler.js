const createActivityFields = ["@context", "type", "actor", "object", "to"];
const objectFields = ["@context", "type", "to", "attributedTo", "content", "mediaType"];
const agendaFields = ["name", "description", "dates"];
const uuid = require('uuid/v1');

function generateCreateAgendaActivity(request) {
    const activity = generateCreateObjectActivity(request, objectFields, isValidAgenda);
    if (!activity) return undefined;
    // This note has a special ID since the url will always provide the updated version
    activity.object.id = "http://127.0.0.1:" + process.env.QUERIER_AGENDA_PORT + "/agenda/updated/" + uuid();
    return activity;
}

function generateCreateVoteActivity(request) {
    const specificObjectFields = objectFields.slice();
    specificObjectFields.push("inReplyTo");
    return generateCreateObjectActivity(request, specificObjectFields, isValidVote);
}

function generateCreateNoContentActivity(request) {
    const specificObjectFields = objectFields.slice();
    var index = specificObjectFields.indexOf("content");
    if (index > -1) specificObjectFields.splice(index, 1);
    return generateCreateObjectActivity(request, specificObjectFields);
}

function generateCreateCloseActivity(request) {
    const specificObjectFields = objectFields.slice();
    specificObjectFields.push("inReplyTo");
    return generateCreateObjectActivity(request, specificObjectFields, isValidClose);
}

function generateCreateObjectActivity(request, objectFields, funIsValidContent) {
    let activity = undefined;
    if (!request) return undefined;
    if (request.type === 'Note' && isValidNote(request, objectFields, funIsValidContent)) {
        activity = agendaNoteToCreateActivity(request, funIsValidContent);
    }
    if (request.type === 'Create' && isValidCreateActivity(request, objectFields, funIsValidContent)) {
        activity = request;
    }
    if (!activity) return undefined;
    activity.published = (new Date()).toISOString();
    activity.object.id = "http://127.0.0.1:" + process.env.QUERIER_AGENDA_PORT + "/agenda/" + uuid();
    activity.id = "http://127.0.0.1:" + process.env.QUERIER_AGENDA_PORT + "/agenda/" + uuid()
    return activity;
}

function isValidCreateActivity(activity, objectFields, funIsValidContent) {
    if (!activity
        || !createActivityFields.every(field => activity.hasOwnProperty(field))
        || activity.type !== "Create"
        || !isValidNote(activity.object, objectFields, funIsValidContent)
    ) return false;
    return true;
}

// funIsValidContent can be undefined (-> does not check the note's content)
function isValidNote(object, fields, funIsContentValid) {
    if (!object
        || !fields.every(field => object.hasOwnProperty(field))
        || object.type !== "Note"
        || object.mediaType !== "application/json"
        || (!!funIsContentValid && !funIsContentValid(object.content))
    ) return false;
    return true;
}

function isValidAgenda(content) {
    if (!content
        || !agendaFields.every(field => content.hasOwnProperty(field))
        || !isDatesArray(content.dates, false)
    ) return false;
    return true;
}

function isValidVote(content) {
    if (!content
        || !content.hasOwnProperty("dates")
        || !isDatesArray(content.dates, true)
    ) return false;
    return true;
}

function isValidClose(content) {
    if (!content
        || !content.hasOwnProperty("date")
        || !(isIsoDate(content.date) || content.date === "")
    ) return false;
    return true;
}

function isDatesArray(array, canBeEmpty) {
    if (!Array.isArray(array)) return false;
    return (array.length === 0 && canBeEmpty)
        || array.length > 0 && array.every(date => isIsoDate(date));
}

function isIsoDate(str) {
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
    var d = new Date(str);
    return d.toISOString()===str;
}

function agendaNoteToCreateActivity(note) {
    return {
        "@context": "https://www.w3.org/ns/activitystreams",
        "type": "Create",
        "actor": note.attributedTo,
        "to": note.to,
        "object": note
    };
}

module.exports = {
    generateCreateAgendaActivity,
    generateCreateCloseActivity,
    generateCreateNoContentActivity,
    generateCreateVoteActivity,
};
