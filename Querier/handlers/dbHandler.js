const AgendaModel = require('../models/agenda');
const mongoose = require('mongoose');

function createNewAgenda(agenda) {
    const agendaContent = {
        _id: agenda.id,
        name: agenda.name,
        description: agenda.description,
        dates: {}
    };
    for (const d of agenda.dates) agendaContent.dates[d] = [];
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

module.exports = {createNewAgenda, getAgenda};
