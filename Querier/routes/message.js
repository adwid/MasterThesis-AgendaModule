const express = require('express');
const router = express.Router();
const db = require("../handlers/dbHandler");

router.get("/new/:uid", (req, res) => {
    db.getNewMessages(req.params.uid)
        .then(messages => {
            if (messages.length === 0) res.status(204).end();
            else res.json(messages);
        })
        .catch((err) => {
            console.error("[ERR] GET MESSAGES : " + err);
            res.status(500).json({error: "Internal error. Please try later or contact admins"});
        })
});

module.exports = router;
