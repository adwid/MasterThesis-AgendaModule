const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
    id: {type: String, required: true},
    hasParticipated: {type: Boolean, default: false}
}, {
    _id: false
});

const DateSchema = new mongoose.Schema({
    date: {type: Date, required: true},
    forIt: {type: [String], required: true}
}, {
    _id: false
});

function minTwoItems(array) {
    return array.length > 1;
}

const AgendaSchema = new mongoose.Schema({
    _id: String,
    name: {type: String, required: true},
    description: {type: String, required: true},
    selectedDate: Date,
    dates: {
        type: [DateSchema],
        required: true,
        validate: [minTwoItems, 'Field \'{PATH}\' needs at least 2 elements.'],
    },
    participants: {
        type: [ParticipantSchema],
        required: true,
        validate: [minTwoItems, 'Field \'{PATH}\' needs at least 2 elements.'],
    }
});

AgendaSchema.index({"participants.id": 1});

module.exports = mongoose.model('Agenda', AgendaSchema);
