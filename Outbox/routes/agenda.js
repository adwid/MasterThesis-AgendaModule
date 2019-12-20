const express = require('express');
const router = express.Router();
const axios = require('axios').default;
const uuid = require('uuid/v4');
const requestHandler = require('../hanlders/requestHandler');

router.post('/create', (req, res) => {
    const activity = requestHandler.generateCreateAgendaActivity(req.body);
    if (!activity) {
        res.status(400).end();
        return;
    }

    forwardToInbox(res, activity, '/', () => res.status(201).json(activity))
});

router.post("/vote", (req, res) => {
    const activity = requestHandler.generateCreateVoteActivity(req.body);
    if (!activity) {
        res.status(400).end();
        return;
    }

    forwardToInbox(res, activity, '/vote', () => res.status(201).json(activity))
});

router.post('/withdraw', (req, res) => {
    const activity = requestHandler.generateCreateWithdrawOrOpenActivity(req.body);
    if (!activity) {
        res.status(400).end();
        return;
    }

    forwardToInbox(res, activity, '/withdraw', () => res.status(201).json(activity))
});

router.post('/close', (req, res) => {
    const activity = requestHandler.generateCreateCloseActivity(req.body);
    if (!activity) {
        res.status(400).end();
        return;
    }

    forwardToInbox(res, activity, '/close', () => res.status(201).json(activity));
});

router.post('/open', (req, res) => {
    const activity = requestHandler.generateCreateWithdrawOrOpenActivity(req.body);
    if (!activity) {
        res.status(400).end();
        return;
    }

    forwardToInbox(res, activity, '/open', () => res.status(201).json(activity));

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
