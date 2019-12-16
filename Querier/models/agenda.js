const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
    id: {type: String, required: true},
    hasParticipated: {type: Boolean, default: false}
}, {
    _id: false
});

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
        type: [DateSchema],
        default: []
    },
    participants: {
        type: [ParticipantSchema],
        required: true
    }
});

module.exports = mongoose.model('Agenda', AgendaSchema);
