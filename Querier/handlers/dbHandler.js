const AgendaModel = require('../models/agenda');
const mongoose = require('mongoose');

function createNewAgenda(agenda) {
    const agendaContent = {
        _id: agenda.id,
        name: agenda.name,
        description: agenda.description,
        dates: {}
    };
    for (const d of agenda.dates) {
        // Parse dates in ISO format to numeric value (since 1970)
        let numericValue = (new Date(d)).getTime();
        agendaContent.dates[numericValue] = [];
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

function getAgenda(id) {
    return new Promise(((resolve, reject) => {
        AgendaModel.findById(id, (err, agenda) => {
            if (err) {
                reject(err);
                return;
            }
            // Translate date as numeric value to ISO string
            const dates = agenda.dates;
            agenda.dates = {};
            for (let date in dates) {
                let iso = (new Date(+date)).toISOString();
                agenda.dates[iso] = dates[date];
            }
            resolve(agenda);
        });
    }));
}

module.exports = {createNewAgenda, getAgenda};
