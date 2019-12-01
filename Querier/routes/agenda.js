const express = require('express');
const router = express.Router();
const eventStore = require('../eventStore');

eventStore.get().events.observe()
    .received((e, cancel) => {
        console.log("Event received ! ");
        console.log(e);
    });

module.exports = router;
