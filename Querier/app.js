var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var database = require('./database');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/agenda", require('./routes/agenda'));
app.use("/message", require('./routes/message'));

database.open()
    .catch(() => {
        console.error('Please check that the MongoDB server is running.');
        process.exit(1);
    });

// initialize the event store subscription
require('./handlers/eventStoreHandler');

module.exports = app;
