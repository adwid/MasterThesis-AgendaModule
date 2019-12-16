const AgendaModel = require('../models/agenda');
const mongoose = require('mongoose');

function createNewAgenda(agenda) {
    const agendaContent = {
        _id: agenda.agendaID,
        name: agenda.name,
        description: agenda.description,
        dates: [],
        participants: []
    };
    agendaContent.participants.push({id: agenda.from});
    for (const t of agenda.to) {
        agendaContent.participants.push({id: t});
    }
    for (const d of agenda.dates) {
        agendaContent.dates.push({date: d, forIt: []});
    }
    const newAgenda = new AgendaModel(agendaContent);
    return newAgenda.save();
}

function applyVote(vote) {
    return withdrawVote(vote)
        .then(() => {
            return AgendaModel.findByIdAndUpdate(vote.agendaID, {
                $push: {
                    "dates.$[element].forIt" : vote.from,
                },
                $set: {
                    "participants.$[participant].hasParticipated": true
                }
            }, {
                arrayFilters : [
                    { "element.date": { $in : vote.dates } },
                    { "participant.id": { $eq : vote.from } }
                ]
            });
        });
}

function withdrawVote(withdrawing) {
    const agendaID = withdrawing.agendaID;
    const userID = withdrawing.from;
    return AgendaModel.findByIdAndUpdate(agendaID, {
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

module.exports = {applyVote, createNewAgenda, getAgenda, getAgendaOf, withdrawVote,};
