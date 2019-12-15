const express = require('express');
const router = express.Router();
const esHandler = require('../handlers/eventStoreHandler');

router.post("/post", (req, res) => {
    let message = JSON.parse(req.body.object.content);
    esHandler.postNewAgenda(message);
    res.end();
});

module.exports = router;
