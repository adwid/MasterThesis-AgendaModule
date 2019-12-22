const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');
const esHandler = require('../handlers/eventStoreHandler');

router.get("/updated/:id", (req, res) => {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    db.getAgenda(fullUrl)
        .then((result) => {
            if (!result) {
                res.status(404).end();
                return;
            }
            res.json(result);
        })
        .catch((err) => {
            console.error("[ERR] GET ID : " + err);
            res.status(500).json({error: "Internal error. Please try later or contact admins"});
        })
});

router.get("/user/:id", (req, res) => {
    db.getAgendaOf(req.params.id)
        .then(agendas => {
            if (agendas.length === 0) {
                res.status(404).end();
                return;
            }
            res.json(agendas);
        })
        .catch(err => {
            console.error("[ERR] GET AGENDA OF : " + err);
            res.status(500).json({error: "Internal error. Please try later or contact admins"});
        });
});

router.get("/from/:actor", (req, res) => {
    esHandler.getActivitiesFromActor(req.params.actor)
        .then(activities => {
            if (activities.list.length === 0) res.status(204).end();
            else res.json(activities.list);
        })
        .catch(err => {
            console.error("[ERR] ES projection : " + err);
            res.status(500).json({error: "Internal error. Please try later or contact admins"});
        });
});

router.get("/:id", (req, res) => {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    esHandler.getSpecificObject(fullUrl)
        .then(object => {
            if (object.count === 0) res.status(204).end();
            else if (object.count === 1) res.json(object.activity);
            else return Promise.reject("The projection counted more than one event for the ID : " + fullUrl);
        })
        .catch(err => {
            console.error("[ERR] ES projection : " + err);
            res.status(500).json({error: "Internal error. Please try later or contact admins"});
        });
});

module.exports = router;
