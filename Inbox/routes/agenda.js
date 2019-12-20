const express = require('express');
const router = express.Router();
const esHandler = require('../handlers/eventStoreHandler');

const routes = [
    "agenda",
    "vote",
    "withdraw",
    "clode",
    "open",
    "reset",
];

router.post("/:route", (req, res, next) => {
    if (!routes.includes(req.params.route)) {
        next();
        return;
    }
    let eventType = req.params.route;
    esHandler.postEvent(req.body, eventType)
        .then(() => {
            res.status(201).end()
        })
        .catch(() => {
            res.status(500).json({
                error: "Internal error. Please try later or contact admins."
            });
        });
});

module.exports = router;
