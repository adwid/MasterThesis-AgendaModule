const express = require('express');
const router = express.Router();
const esHandler = require('../handlers/eventStoreHandler');

router.post("/", (req, res) => {
    esHandler.postEvent(req.body, "newAgenda");
    res.end();
});

router.post("/vote", (req, res) => {
    esHandler.postEvent(req.body, "vote");
    res.end();
});

router.post("/withdraw", (req, res) => {
    esHandler.postEvent(req.body, "withdraw");
    res.end();
});

module.exports = router;
