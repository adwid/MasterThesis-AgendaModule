const express = require('express');
const router = express.Router();
const axios = require('axios').default;
const uuid = require('uuid/v4');

router.post('/create', (req, res) => {
    // if (!isNote(req.body)) {
    //     res.status(400).json({
    //         error: "Basic fields required. Please respect the format."
    //     });
    //     return;
    // }

    // const newActivity = noteToCreateActivity(req.body);
    const newActivity = req.body;
    newActivity.id = uuid();

    forwardToInbox(res, newActivity, '/')
        .then(() => res.json({id: newActivity.id}))
});

router.post("/vote", (req, res) => {
    forwardToInbox(res, req.body, '/vote')
        .then(() => res.end());
});

router.post('/withdraw', (req, res) => {
    forwardToInbox(res, req.body, '/withdraw')
        .then(() => res.end());
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

function forwardToInbox(res, activity, path) {
    return axios.post('http://localhost:' + process.env.INBOX_AGENDA_PORT + '/agenda' + path, activity)
        .catch(err => {
            res.status(500).json({
                error: "Internal error. Please try later or contact admins."
            });
            console.error("[err] forwardToInbox : " + err)
        });
}

function isIsoDate(str) {
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
    var d = new Date(str);
    return d.toISOString()===str;
}

module.exports = router;
