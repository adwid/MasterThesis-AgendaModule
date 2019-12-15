const mongoose = require('mongoose');

const DateSchema = new mongoose.Schema({
    date: {type: String, required: true},
    forIt: {type: [String], required: true}
}, {
    _id: false
});

const AgendaSchema = new mongoose.Schema({
    _id: String,
    name: {type: String, required: true},
    description: {type: String, required: true},
    dates: {
        type: [ DateSchema ],
        default: []
    },
    answeredBy: { type: [String], default: [] }
});

module.exports = mongoose.model('Agenda', AgendaSchema);
