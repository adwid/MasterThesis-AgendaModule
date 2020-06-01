const express = require('express');
const router = express.Router();
const esHandler = require('../handlers/eventStoreHandler');
const { v1: uuid } = require('uuid');

const routes = [
    "create",
    "vote",
    "withdraw",
    "close",
    "open",
    "reset",
];

router.post("/secretary/:route", (req, res, next) => {
    if (!routes.includes(req.params.route)) {
        next();
        return;
    }
    let eventType = req.params.route;
    let activity = req.body;
    postEvent(activity, eventType, res);
});

router.post("/news", (req, res) => {
    let activity = req.body;
    postEvent(activity, "news", res);
});

function postEvent(activity, eventType, res) {
    esHandler.postEvent(activity, eventType)
        .then(() => {
            res.status(201).end()
        })
        .catch(() => {
            res.status(500).json({
                error: "Internal error. Please try later or contact admins."
            });
        });
}


module.exports = router;
