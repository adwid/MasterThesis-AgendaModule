const express = require('express');
const router = express.Router();
const axios = require('axios').default;
const uuid = require('uuid/v4');
const requestHandler = require('../hanlders/requestHandler');

const paths = {
    'close': {inboxDestination: '/close', generator: requestHandler.generateCreateCloseActivity},
    'create': {inboxDestination: '/', generator: requestHandler.generateCreateAgendaActivity},
    'open': {inboxDestination: '/open', generator: requestHandler.generateCreateWithdrawOrOpenActivity},
    'vote': {inboxDestination: '/vote', generator: requestHandler.generateCreateVoteActivity},
    'withdraw': {inboxDestination: '/withdraw', generator: requestHandler.generateCreateWithdrawOrOpenActivity},
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

    forwardToInbox(res, activity, currentPath.inboxDestination, () => res.status(201).json(activity))
});

function forwardToInbox(res, activity, path, callback) {
    // todo
    return axios.post('http://localhost:' + process.env.INBOX_AGENDA_PORT + '/agenda' + path, activity)
        .then(callback)
        .catch(err => {
            res.status(502).json({
                error: "Error with the recipient's inbox."
            });
            console.error("[err] forwardToInbox : " + err)
        });
}

module.exports = router;
