var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const eventStore = require('./eventStore');

var app = express();

eventStore.connect()
    .then(() => console.log("Connected to event store !"))
    .catch((err) => console.error("Error with event store connection : %s", err));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/agenda", require('./routes/agenda'));

module.exports = app;
