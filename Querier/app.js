var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const agendaRouter = require('./routes/agenda');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/agenda', agendaRouter);

module.exports = app;
