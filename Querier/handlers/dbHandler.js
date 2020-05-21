const AgendaModel = require('../models/agenda');
const MessageModel = require('../models/message');
const { v1: uuid } = require('uuid');

function createNewAgenda(noteObject) {
    const agenda = noteObject.content;
    const newAgendaContent = {
        _id: process.env.PREFIX + process.env.HOST + ":" + process.env.AGENDA_QUERIER_PORT + "/agenda/content/" + uuid(),
        name: agenda.name,
        description: agenda.description,
        dates: [],
        participants: []
    };
    newAgendaContent.participants.push({id: noteObject.attributedTo});
    for (const participant of noteObject.to) {
        newAgendaContent.participants.push({id: participant});
    }
    for (const d of agenda.dates) {
        newAgendaContent.dates.push({date: d, forIt: []});
    }
    const newAgenda = new AgendaModel(newAgendaContent);
    return newAgenda.save();
}

function applyVote(noteobject) {
    const agendaID = noteobject.content.agendaID;
    const userID = noteobject.attributedTo;
    const dates = noteobject.content.dates;
    return withdrawVote(noteobject)
        .then(() => {
            return AgendaModel.findOneAndUpdate({
                _id: {$eq: agendaID},
                selectedDate: {$exists: false}
            }, {
                $addToSet: {
                    "dates.$[element].forIt": userID,
                },
                $set: {
                    "participants.$[participant].hasParticipated": true
                }
            }, {
                arrayFilters: [
                    {"element.date": {$in: dates}},
                    {"participant.id": {$eq: userID}}
                ]
            });
        });
}

function closeAgenda(noteObject) {
    const agendaID = noteObject.content.agendaID;
    const selectedDate = noteObject.content.date;
    const userID = noteObject.attributedTo;
    const findRequest = {
        _id: {$eq: agendaID},
        "participants.0.id": userID
    };
    if (selectedDate !== "") {
        findRequest.dates = {$elemMatch: {date: {$eq: selectedDate}}};
    }
    return AgendaModel.findOneAndUpdate(findRequest, {
        $set: {selectedDate: selectedDate}
    }, {
        new: true
    });
}

function getNewMessages(uid) {
    return MessageModel.find({
        to: uid,
        seen: false
    }).then(messages => {
        const promises = [];
        for (const message of messages) {
            promises.push(message.update({
                $set: {seen: true}
            }).catch(err => {
                console.error("[ERR] db update : " + err)
            }));
        }
        promises.push(Promise.resolve(messages)); // keep messages for next step
        return Promise.all(promises);
    }).then(resolvedPromises => {
        const jsonMessages = [];
        if (resolvedPromises.length  === 0) return Promise.resolve(jsonMessages);
        const messages = resolvedPromises[resolvedPromises.length - 1];
        for (const message of messages) jsonMessages.push(message.toJSON());
        return Promise.resolve(jsonMessages);
    });
}

function openAgenda(noteObject) {
    const agendaID = noteObject.content.agendaID;
    const userID = noteObject.attributedTo;
    return AgendaModel.findOneAndUpdate({
        _id: {$eq: agendaID},
        "participants.0.id": userID
    }, {
        $unset: {selectedDate: ""}
    }, {
        new: true
    });
}

function resetAgenda(noteObject) {
    const agendaID = noteObject.content.agendaID;
    const userID = noteObject.attributedTo;
    return AgendaModel.findOneAndUpdate({
        _id: {$eq: agendaID},
        "participants.0.id": userID
    }, {
        $set: {
            "dates.$[].forIt": [],
            "participants.$[].hasParticipated": false
        },
        $unset: {selectedDate: ""}
    }, {
        new: true
    });
}

function storeMessage(noteObject) {
    const promises = [];
    for (const recipient of noteObject.to) {
        const url = new URL(recipient);
        if (url.hostname === process.env.HOST) // only store for users of the current Agenda Module's domain
            promises.push(storeMessageAux(noteObject, recipient))
    }
    return Promise.all(promises)
}

function storeMessageAux(noteObject, to) {
    const message = new MessageModel({
        to: to,
        url: noteObject.content.url,
        text: noteObject.content.type
    });
    return message.save()
        .catch(err => console.error("[ERR]: not able to save message : " + err))
}

function withdrawVote(noteObject) {
    const agendaID = noteObject.content.agendaID;
    const userID = noteObject.attributedTo;
    return AgendaModel.findOneAndUpdate({
        _id: {$eq: agendaID},
        selectedDate: {$exists: false}
    }, {
        $pull: {
            "dates.$[].forIt": userID,
        },
        $set: {
            "participants.$[participant].hasParticipated": false
        }
    }, {
        arrayFilters : [
            { "participant.id": { $eq : userID } }
        ]
    });
}

function getAgenda(id) {
    return AgendaModel.findById(id)
        .then(agenda => {
            return Promise.resolve(documentToJSON(agenda));
        });
}

function getAgendaOf(userID) {
    return AgendaModel.find({"participants.id": {$eq: userID}})
        .then(agendas => {
            for (const index in agendas) agendas[index] = documentToJSON(agendas[index]);
            return Promise.resolve(agendas);
        });
}

function documentToJSON(agenda) {
    if (!agenda) return {};
    var json = agenda.toJSON();
    delete json._id;
    delete json.__v;
    json.adendaID = agenda.id;
    return json;
}

module.exports = {
    applyVote,
    closeAgenda,
    createNewAgenda,
    getAgenda,
    getAgendaOf,
    getNewMessages,
    openAgenda,
    resetAgenda,
    storeMessage,
    withdrawVote,};
