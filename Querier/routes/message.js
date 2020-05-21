const express = require('express');
const router = express.Router();
const db = require("../handlers/dbHandler");

router.get("/all/:uid", (req, res) => {
    processRequest(db.getAllMessages, req.params.uid, res);
});

router.get("/new/:uid", (req, res) => {
    processRequest(db.getNewMessages, req.params.uid, res);
});

function processRequest(dbFunction, uid, response) {
    dbFunction(uid)
        .then(messages => {
            if (messages.length === 0) response.status(204).end();
            else response.json(messages);
        })
        .catch((err) => {
            console.error("[ERR] GET MESSAGES : " + err);
            response.status(500).json({error: "Internal error. Please try later or contact admins"});
        })
}

module.exports = router;
