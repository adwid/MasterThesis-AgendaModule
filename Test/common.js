const chai = require('chai');
const chaiHTTP = require('chai-http');

chai.use(chaiHTTP);
chai.should();

const agendaOutbox = chai.request(process.env.PREFIX + process.env.HOST + ":" + process.env.AGENDA_OUTBOX_PORT).keepOpen();
const agendaQuerier = chai.request(process.env.PREFIX + process.env.HOST + ":" + process.env.AGENDA_QUERIER_PORT).keepOpen();
const agendaSecretary = process.env.PREFIX + process.env.HOST + ":" + process.env.AGENDA_QUERIER_PORT + "/agenda/secretary";

const actorsIDs = [];
const buffer = [];
const timeout = 100 ;
const slow = 1000;


module.exports = {
    actorsIDs,
    agendaOutbox,
    agendaQuerier,
    agendaSecretary,
    buffer,
    chai,
    slow,
    timeout,
}
