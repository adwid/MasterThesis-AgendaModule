const express = require('express');
const router = express.Router();
const axios = require('axios').default;

router.post('/create', (req, res) => {
    const requiredProperties = ["type", "id", "name"];
    const body = req.body;
    if (!requiredProperties.every(property => body[property])) {
        res.status(400).json({"Message": "Here are the required fields : " + requiredProperties});
        return;
    }

    const newActivity = {
        "@context": "https://www.w3.org/ns/activitystreams",
        "summary": "Agenda created by " + body.id,
        "type": "Create",
        "actor": {
            "type": "Person",
            "name": body.id
        },
        "object": {
            "type": "Agenda",
            "name": body.name,
            "content": "Lorem ipsum"
        }
    };

    toInbox(newActivity)
        .catch(err => console.log("toInbox : err : " + err))
        .finally(() => {
            res.end();
        });
});

function toInbox(activity) {
    return axios.post('http://localhost:' + process.env.INBOX_AGENDA_PORT + '/agenda/', activity);
}

module.exports = router;
