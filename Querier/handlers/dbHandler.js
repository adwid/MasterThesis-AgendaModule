const AgendaModel = require('../models/agenda');
const mongoose = require('mongoose');

function createNewAgenda(agenda) {
    const agendaContent = {
        _id: agenda.id,
        name: agenda.name,
        description: agenda.description,
        dates: []
    };
    for (const d of agenda.dates) {
        agendaContent.dates.push({date: d, forIt: []})
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
    const agendaID = vote.agendaID;
    const userID = vote.from;
    return cleanVotes(agendaID, userID)
        .then(() => {
            return new Promise((resolve, reject) => {
                AgendaModel.findByIdAndUpdate(agendaID, {
                        $push: {
                            "dates.$[element].forIt" : userID,
                            "answeredBy": userID
                        }
                    },
                    {
                        arrayFilters : [ { "element.date": { $in : vote.dates } } ]
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

function cleanVotes(agendaID, userID) {
    return new Promise((resolve, reject) => {
        AgendaModel.findByIdAndUpdate(agendaID, {
            $pull: {
                "dates.$[].forIt": userID,
                "answeredBy": userID
            }
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

module.exports = {createNewAgenda, applyVote, getAgenda};
