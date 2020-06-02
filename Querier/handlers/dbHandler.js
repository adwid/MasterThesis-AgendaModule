const AgendaModel = require('../models/agenda');
const MessageModel = require('../models/message');
const NewsModel = require('../models/news');
const { v1: uuid } = require('uuid');

function createNewAgenda(activity) {
    const noteObject = activity.object;
    const agenda = noteObject.content;
    let actorURL = new URL(noteObject.attributedTo);
    if (actorURL.hostname !== process.env.HOST)
        return Promise.reject({
            name: "MyNotFoundError",
            message: "We have different domain. Please contact your secretary."
        })
    const newAgendaContent = {
        _id: process.env.PREFIX + process.env.HOST + ":" + process.env.AGENDA_QUERIER_PORT + "/agenda/content/" + uuid(),
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

function applyVote(activity) {
    const noteobject = activity.object;
    const agendaID = noteobject.content.agendaID;
    const userID = noteobject.attributedTo;
    const dates = noteobject.content.dates;

    return withdrawVote(activity)
        .then(() => {
            return AgendaModel.findOneAndUpdate({
                _id: {$eq: agendaID},
                selectedDate: {$exists: false},
                participants: {$elemMatch: {id: {$eq: userID}}},
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

function closeAgenda(activity) {
    const noteObject = activity.object;
    const agendaID = noteObject.content.agendaID;
    const selectedDate = noteObject.content.date;
    const userID = noteObject.attributedTo;
    const findRequest = {
        _id: {$eq: agendaID},
        "participants.0.id": userID,
        dates: {$elemMatch: {date: {$eq: selectedDate}}},
    };
    return AgendaModel.findOneAndUpdate(findRequest, {
        $set: {selectedDate: selectedDate}
    }).then(agenda => {
        if (!agenda) return Promise.reject({
            name: "MyNotFoundError",
            message: "You do not have the permission, " +
                "the agenda does not exist, " +
                "or the chosen date does not exist."
        });
        return Promise.resolve(agenda);
    });
}

function getActivity(id) {
    return MessageModel.findOne({
        $or: [
            {id: id},
            {"object.id": id}
        ]
    }, "-_id -__v")
}

function getNewNews(uid) {
    return NewsModel.find({
        to: uid,
        seen: false
    }).then(news => {
        const promises = [];
        for (const newsItem of news) {
            promises.push(newsItem.updateOne({
                $set: {seen: true}
            }).catch(err => {
                console.error("[ERR] db update : " + err)
            }));
        }
        promises.push(Promise.resolve(news)); // keep news for next step
        return Promise.all(promises);
    }).then(resolvedPromises => {
        const jsonNews = [];
        if (resolvedPromises.length === 0) return Promise.resolve(jsonNews);
        const news = resolvedPromises[resolvedPromises.length - 1];
        for (const newsItem of news) jsonNews.push(newsItem.toJSON());
        return Promise.resolve(jsonNews);
    });
}

function getOldNews(uid) {
    return NewsModel.find({
        to: uid,
        seen: true
    });
}

function openAgenda(activity) {
    const noteObject = activity.object;
    const agendaID = noteObject.content.agendaID;
    const userID = noteObject.attributedTo;
    return AgendaModel.findOneAndUpdate({
        _id: {$eq: agendaID},
        "participants.0.id": userID
    }, {
        $unset: {selectedDate: ""}
    }).then(agenda => {
        if (!agenda) return Promise.reject({
            name: "MyNotFoundError",
            message: "You do not have the permission, " +
                "or the agenda does not exist.",
        });
        return Promise.resolve(agenda);

    });
}

function resetAgenda(activity) {
    const noteObject = activity.object;
    const agendaID = noteObject.content.agendaID;
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
    }).then(agenda => {
        if (!agenda) return Promise.reject({
            name: "MyNotFoundError",
            message: "You do not have the permission, " +
                "the agenda does not exist, " +
                "or the chosen date does not exist."
        });
        return Promise.resolve(agenda);
    });
}

function storeActivity(activity) {
    const message = new MessageModel(activity);
    message._id = activity.id
    return message.save();
}

function storeNews(activity) {
    const promises = [];
    const to = Array.isArray(activity.to) ? activity.to : [activity.to];
    for (const actor of to) {
        let url = new URL(actor);
        // only store news for users in the same domain than the current instance :
        if (url.hostname === process.env.HOST)
            promises.push(storeNewsAux(activity, actor));
    }
    return Promise.all(promises);
}

function storeNewsAux(activity, recipient) {
    const newNews = new NewsModel({
        message: activity.id,
        to: recipient
    });
    return newNews.save()
        .catch(err => {
            console.error("[ERR] not able to store a news in DB : " + err);
        });
}

function withdrawVote(activity) {
    const noteObject = activity.object;
    const agendaID = noteObject.content.agendaID;
    const userID = noteObject.attributedTo;
    return AgendaModel.findOneAndUpdate({
        _id: {$eq: agendaID},
        selectedDate: {$exists: false},
        participants: {$elemMatch: {id: {$eq: userID}}},
    }, {
        $pull: {
            "dates.$[].forIt": userID,
        },
        $set: {
            "participants.$[participant].hasParticipated": false
        }
    }, {
        arrayFilters: [
            {"participant.id": {$eq: userID}}
        ]
    }).then(agenda => {
        if (!agenda) return Promise.reject({
            name: "MyNotFoundError",
            message: "The agenda does not exist, " +
                "you are not part of the participants, " +
                "or the agenda is closed."
        });
        return Promise.resolve(agenda);

    });
}

function getAgenda(id) {
    return AgendaModel.findById(id)
        .then(agenda => {
            return Promise.resolve(documentToJSON(agenda));
        });
}

function getAgendaWith(userID) {
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
    json.agendaID = agenda.id;
    return json;
}

module.exports = {
    applyVote,
    closeAgenda,
    createNewAgenda,
    getActivity,
    getAgenda,
    getAgendaWith,
    getNewNews,
    getOldNews,
    openAgenda,
    resetAgenda,
    storeActivity,
    storeNews,
    withdrawVote,
};
