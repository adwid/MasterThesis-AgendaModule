const express = require('express');
const router = express.Router();
const axios = require('axios').default;
const requestHandler = require('../hanlders/requestHandler');

const paths = {
    'close': {inboxDestination: '/close', generator: requestHandler.generateCreateCloseActivity},
    'create': {inboxDestination: '/create', generator: requestHandler.generateCreateAgendaActivity},
    'open': {inboxDestination: '/open', generator: requestHandler.generateCreateNoContentActivity},
    'reset': {inboxDestination: '/reset', generator: requestHandler.generateCreateNoContentActivity},
    'vote': {inboxDestination: '/vote', generator: requestHandler.generateCreateVoteActivity},
    'withdraw': {inboxDestination: '/withdraw', generator: requestHandler.generateCreateNoContentActivity},
};

router.post('/:path', (req, res, next) => {
    if (!paths.hasOwnProperty(req.params.path)) {
        next();
        return;
    }
    const currentPath = paths[req.params.path];
    const activity = currentPath.generator(req.body);
    if (!activity) {
        res.status(400).end();
        return;
    }

    forwardToInboxes(activity, currentPath.inboxDestination)
        .then(_ => res.status(201).json(activity))
        .catch(err => {
            console.error("Error(s) while forwarding to inboxes : " + err);
            res.status(500).json({error: "An internal occurred. Please try later or contact admins."})
        });
});

function forwardToInboxes(activity, path) {
    const actorsIDs = activity.to;
    let promises = [];
    for (const id of actorsIDs) {
        promises.push(axios.get(id));
    }
    return Promise.all(promises)
        .then((actors) => {
            // todo manage gateway, general url and external inbox url case
            promises = [];
            for (const actor of actors) {
                const promise = axios.post('http://10.42.0.1:' + process.env.AGENDA_INBOX_PORT + '/agenda' + path, activity);
                promises.push(promise);
            }
            return Promise.all(promises);
        });
}

module.exports = router;
