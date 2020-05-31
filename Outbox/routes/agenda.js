const express = require('express');
const router = express.Router();
const axios = require('axios').default;
const requestHandler = require('../handlers/requestHandler');
const db = require("../handlers/dbHandler");
const { v1: uuid } = require('uuid');

const routes = {
    'close': {inboxDestination: '/close', activityGenerator: requestHandler.generateCreateCloseActivity},
    'create': {inboxDestination: '/create', activityGenerator: requestHandler.generateCreateAgendaActivity},
    'open': {inboxDestination: '/open', activityGenerator: requestHandler.generateCreateAgendaIDActivity},
    'reset': {inboxDestination: '/reset', activityGenerator: requestHandler.generateCreateAgendaIDActivity},
    'vote': {inboxDestination: '/vote', activityGenerator: requestHandler.generateCreateVoteActivity},
    'withdraw': {inboxDestination: '/withdraw', activityGenerator: requestHandler.generateCreateAgendaIDActivity},
};

router.post('/:route', (req, res, next) => {
    if (!routes.hasOwnProperty(req.params.route)) {
        next();
        return;
    }
    const currentRoute = routes[req.params.route];
    const activity = currentRoute.activityGenerator(req.body);
    if (!activity) {
        res.status(400).end();
        return;
    }

    activity.object.id = process.env.PREFIX + process.env.HOST + ":" + process.env.AGENDA_OUTBOX_PORT + "/agenda/" + uuid();
    activity.id = process.env.PREFIX + process.env.HOST + ":" + process.env.AGENDA_OUTBOX_PORT + "/agenda/" + uuid();

    // Forward the activity to the secretary's inbox (of the agenda module)
    // The secretary is in charge of processing and forwarding all messages
    db.storeActivity(activity)
        .then(_ => {
            // todo get the actor domain ? check if it the same ?
            return axios.post(process.env.PREFIX + process.env.HOST + ':' + process.env.AGENDA_INBOX_PORT + '/agenda/secretary' + currentRoute.inboxDestination, activity)
        })
        .then(_ => res.status(201).json(activity))
        .catch(err => {
            console.error("Error(s) while forwarding to secretary : " + err);
            res.status(500).json({error: "An internal occurred. Please try later or contact admins."})
        });
});

router.get("/:id", (req, res) => {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    db.getActivity(fullUrl)
        .then(activity => {
            if (!activity) return res.status(204).end();
            res.json(activity);
        })
        .catch(err => {
            console.error("[ERR] get activity: " + err);
            res.status(500).json({error: "An internal occurred. Please try later or contact admins."})
        });
});

module.exports = router;
