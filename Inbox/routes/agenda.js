const express = require('express');
const router = express.Router();
const esHandler = require('../handlers/eventStoreHandler');

router.post("/", (req, res) => {
    postEvent(req.body, "newAgenda", res);
});

router.post("/vote", (req, res) => {
    postEvent(req.body, "vote", res);
});

router.post("/withdraw", (req, res) => {
    postEvent(req.body, "withdraw", res);
});

function postEvent(event, type, res) {
    esHandler.postEvent(event, type)
        .then(() => {
            res.end()
        })
        .catch(() => {
            res.status(500).json({
                error: "Internal error. Please try later or contact admins."
            });
        });
}

module.exports = router;
