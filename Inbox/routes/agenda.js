const express = require('express');
const router = express.Router();
const esHandler = require('../handlers/eventStoreHandler');

router.post("/post", (req, res) => {
    esHandler.postNewAgenda(req.body);
    res.end();
});

module.exports = router;
