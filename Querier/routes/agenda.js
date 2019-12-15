const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');

router.get("/:id", (req, res) => {
    db.getAgenda(req.params.id)
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

module.exports = router;
