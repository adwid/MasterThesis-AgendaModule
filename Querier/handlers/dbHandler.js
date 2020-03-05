const AgendaModel = require('../models/agenda');

function createNewAgenda(noteObject) {
    const agenda = noteObject.content;
    const newAgendaContent = {
        _id: noteObject.id,
        name: agenda.name,
        description: agenda.description,
        dates: [],
        participants: []
    };
    newAgendaContent.participants.push({id: noteObject.attributedTo});
    for (const participant of agenda.with) {
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
    const agendaID = noteObject.inReplyTo;
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
    });
}

function openAgenda(noteObject) {
    const agendaID = noteObject.inReplyTo;
    const userID = noteObject.attributedTo;
    return AgendaModel.findOneAndUpdate({
        _id: {$eq: agendaID},
        "participants.0.id": userID
    }, {
        $unset: {selectedDate: ""}
    });
}

function resetAgenda(noteObject) {
    const agendaID = noteObject.inReplyTo;
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
    });
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
    openAgenda,
    resetAgenda,
    withdrawVote,};
