const express = require('express');
const router = express.Router();
const eventStore = require("../eventStore");

router.post("/", (req, res) => {
    eventStore.get().communication.activity().postAgenda(req.body)
        .failed((err, command) => {
            console.error("Error while sending message to ES : %s", err);
            res.status(500).end();
        })
        .delivered(command => {
            res.end();
        });
});

module.exports = router;
