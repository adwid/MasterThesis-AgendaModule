var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const eventStore = require('./eventStore');

var app = express();

eventStore.connect()
    .catch(err => {
        console.error("Error with event store connection : %s", err);
        process.exit(1);
    })
    .then(() => {
        console.log("Connected to event store !");
        app.use('/agenda', require('./routes/agenda'));
    });

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


module.exports = app;
