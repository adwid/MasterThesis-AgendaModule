const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');

router.get("/:id", (req, res) => {
    db.getAgenda("http://127.0.0.1:" + process.env.QUERIER_AGENDA_PORT + "/agenda/" + req.params.id)
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

module.exports = router;
