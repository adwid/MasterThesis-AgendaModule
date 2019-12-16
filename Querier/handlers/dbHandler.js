const AgendaModel = require('../models/agenda');
const mongoose = require('mongoose');

function createNewAgenda(agenda) {
    const agendaContent = {
        _id: agenda.id,
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
    return new Promise((resolve, reject) => {
        newAgenda.save({checkKeys: false}, (err, response) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(response);
        })
    });
}

function applyVote(vote) {
    return withdrawVote(vote)
        .then(() => {
            return new Promise((resolve, reject) => {
                AgendaModel.findByIdAndUpdate(vote.agendaID, {
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
                    },
                    (err, result) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve();
                    });
            });
        });
}

function withdrawVote(withdrawing) {
    const agendaID = withdrawing.agendaID;
    const userID = withdrawing.from;
    return new Promise((resolve, reject) => {
        AgendaModel.findByIdAndUpdate(agendaID, {
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
        }, (err, result) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

function getAgenda(id) {
    return new Promise(((resolve, reject) => {
        AgendaModel.findById(id, (err, agenda) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(agenda);
        });
    }));
}

function getAgendaOf(userID) {
    return new Promise((resolve, reject) => {
        AgendaModel.find({"participants.id": {$eq: userID}}, (err, agendas) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(agendas);
        });
    });
}

module.exports = {applyVote, createNewAgenda, getAgenda, getAgendaOf, withdrawVote,};
