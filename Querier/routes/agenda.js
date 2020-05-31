const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');
const esHandler = require('../handlers/eventStoreHandler');

router.get("/with/:id", (req, res) => {
    db.getAgendaWith(req.params.id)
        .then(agendas => {
            if (agendas.length === 0) {
                res.status(204).end();
                return;
            }
            res.json(agendas);
        })
        .catch(err => {
            console.error("[ERR] GET AGENDA OF : " + err);
            res.status(500).json({error: "Internal error. Please try later or contact admins"});
        });
});

router.get("/secretary", (req, res) => {
    res.json({
        "@context": "http://www.w3.org/ns/activitystreams",
        "id": process.env.PREFIX + process.env.HOST + ":" + process.env.AGENDA_QUERIER_PORT + "/agenda/secretary",
        "type": "Application",
        "name": "Agenda module secretariat",
        "summary": "In charge of processing all messages concerning the agenda module (domain " +
            process.env.PREFIX + process.env.HOST + ")",
        "inbox": process.env.PREFIX + process.env.HOST + ":" + process.env.AGENDA_INBOX_PORT + "/agenda/secretary",
    })
});

router.get("/content/:id", (req, res) => {
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

router.get("/:id", (req, res) => {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    esHandler.getSpecificObjects([fullUrl])
        .then(esResponse => {
            const list = esResponse.list;
            if (!list || list.length === 0) res.status(204).end();
            else if (list.length === 1) res.json(list[0]);
            else return Promise.reject("The projection counted more than one event for the ID : " + fullUrl);
        })
        .catch(err => {
            console.error("[ERR] ES projection : " + err);
            res.status(500).json({error: "Internal error. Please try later or contact admins"});
        });
});

module.exports = router;
