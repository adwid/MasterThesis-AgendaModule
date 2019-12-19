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
    forwardToInbox(res, req.body, '/vote', () => res.end());
});

router.post('/withdraw', (req, res) => {
    forwardToInbox(res, req.body, '/withdraw', () => res.end())
});

router.post('/close', (req, res) => {
    forwardToInbox(res, req.body, "/close", () => res.end());
});

router.post('/open', (req, res) => {
    forwardToInbox(res, req.body, "/open", () => res.end());
});

function isNote(body) {
    const noteFields = ['type', 'content', 'attributedTo', 'to', 'mediaType'];
    const contentFields = ["description", "dates"];

    if (body.type !== "Note"
        || !noteFields.every(key => body[key])
        || body.mediaType !== "application/json") return false;

    try {
        body.content = JSON.parse(body.content);
    } catch(e) {
        return false;
    }

    if (!contentFields.every(key => body.content[key])
        || !Array.isArray(body.content.dates)
        || !body.content.dates.every(d => isIsoDate(d))) return false;

    return true;
}

function noteToCreateActivity(note) {
    note.content = JSON.stringify(note.content);
    return {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "Create",
        actor: note.attributedTo,
        to: note.to,
        object: note
    };
}

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
