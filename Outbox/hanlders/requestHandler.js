const createActivityFields = ["@context", "type", "actor", "object", "to"];
const objectFields = ["@context", "type", "to", "attributedTo", "content", "mediaType"];
const agendaFields = ["name", "description", "dates"];
const voteFields = ["dates"];
const uuid = require('uuid/v1');

function generateCreateAgendaActivity(request) {
    const activity = generateCreateObjectActivity(request, objectFields, isValidAgenda);
    if (!activity) return undefined;
    // todo the next id isn't correct... each participant will use the same server instead of using their server
    activity.object.id = "http://127.0.0.1:" + process.env.QUERIER_AGENDA_PORT + "/agenda/" + uuid();
    activity.id = uuid(); //todo create apprioriate url in order to retrieve the activity ?
    return activity;
}

function generateCreateVoteActivity(request) {
    const specificObjectFields = objectFields.slice();
    specificObjectFields.push("inReplyTo");
    const activity = generateCreateObjectActivity(request, specificObjectFields, isValidVote);
    if (!activity) return undefined;
    activity.object.id = uuid(); // todo create apprioriate url in order to retrieve the activity ?
    activity.id = uuid(); //todo create apprioriate url in order to retrieve the activity ?
    return activity;
}

function generateCreateWithdrawActivity(request) {
    const specificObjectFields = objectFields.slice();
    var index = specificObjectFields.indexOf("content");
    if (index > -1) specificObjectFields.splice(index, 1);
    const activity = generateCreateObjectActivity(request, specificObjectFields, ()=>{return true});
    if (!activity) return undefined;
    activity.object.id = uuid(); // todo create apprioriate url in order to retrieve the activity ?
    activity.id = uuid(); //todo create apprioriate url in order to retrieve the activity ?
    return activity;
}

function generateCreateObjectActivity(request, objectFields, funIsValidObject) {
    let activity = undefined;
    if (!request) return undefined;
    if (request.type === 'Note' && isValidNote(request, objectFields, funIsValidObject)) {
        activity = agendaNoteToCreateActivity(request, funIsValidObject);
    }
    if (request.type === 'Create' && isValidCreateActivity(request, objectFields, funIsValidObject)) {
        activity = request;
    }
    if (!activity) return undefined;
    activity.published = (new Date()).toISOString();
    return activity;
}

function isValidCreateActivity(activity, objectFields, funIsContentValid) {
    if (!activity
        || !createActivityFields.every(field => activity.hasOwnProperty(field))
        || activity.type !== "Create"
        || !isValidNote(activity.object, objectFields, funIsContentValid)
    ) return false;
    return true;
}

function isValidNote(object, fields, funIsContentValid) {
    if (!object
        || !fields.every(field => object.hasOwnProperty(field))
        || object.type !== "Note"
        || object.mediaType !== "application/json"
        || !funIsContentValid(object.content)
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
    const activity = {
        "@context": "https://www.w3.org/ns/activitystreams",
        "type": "Create",
        "actor": note.attributedTo,
        "to": note.to,
        "object": note
    };

    return activity;
}

module.exports = {
    generateCreateAgendaActivity,
    generateCreateVoteActivity,
    generateCreateWithdrawActivity
};
