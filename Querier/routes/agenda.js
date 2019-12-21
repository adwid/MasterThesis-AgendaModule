const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');

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

router.get("/:id", (req, res) => {
    // todo return activity
    res.json({message: "Soon !"});
});

module.exports = router;
