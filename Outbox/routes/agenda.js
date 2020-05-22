const express = require('express');
const router = express.Router();
const axios = require('axios').default;
const requestHandler = require('../handlers/requestHandler');

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

    // Forward the activity to the secretary's inbox (of the agenda module)
    // The secretary is in charge of processing and forwarding all messages
    axios.post(process.env.PREFIX + process.env.HOST + ':' + process.env.AGENDA_INBOX_PORT + '/agenda/secretary' + currentRoute.inboxDestination, activity)
        .then(_ => res.status(201).end())
        .catch(err => {
            console.error("Error(s) while forwarding to secretary : " + err);
            res.status(500).json({error: "An internal occurred. Please try later or contact admins."})
        });
});

module.exports = router;
