const mongoose = require('mongoose');

const AgendaSchema = new mongoose.Schema({
    _id: String,
    name: {type: String, required: true},
    description: {type: String, required: true},
    dates: {}, // todo
    answeredBy: { type: [String], default: [] }
});

module.exports = mongoose.model('Agenda', AgendaSchema);
