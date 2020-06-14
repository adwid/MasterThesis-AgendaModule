const common = require("../common");
const chai = common.chai;
const activityHelper = require('../helpers/activityHelper');
const db = require('../helpers/dbHelper');

const actors = common.actorsIDs;
const agendaSecretary = common.agendaSecretary;

describe("[Agenda] Admin tools", function () {
    let agendaID;
    const newAgenda = {
        "name": "Meeting INGI",
        "description": "Important meeting about sinf11ba's program (+- 1h)",
        "dates": [
            "2025-03-15T14:00:00.000Z",
            "2025-03-16T14:00:00.000Z",
            "2025-03-17T14:00:00.000Z",
            "2025-03-18T14:00:00.000Z"
        ],
        "with": [
            actors[1],
            actors[2],
            actors[3],
        ]
    };

    before(function (done) {
        db.cleanAgendaQuerierDB().then(_ => done())
            .catch(err => {
                throw err
            });
    })

    this.slow(common.slow)
    beforeEach(done => setTimeout(done, common.timeout));

    describe("actor[0] creates an agenda", function () {
        activityHelper.shouldPostActivity(common.agendaOutbox, "/agenda/create", actors[0], common.agendaSecretary, newAgenda);
    });

    describe("actor[0] receives the agenda", function () {
        activityHelper.shouldReceiveActivity("actor00", common.agendaQuerier, "/agenda/news/new/" + encodeURIComponent(actors[0]), agendaSecretary);

        it('should be the notification', function () {
            common.buffer.should.have.lengthOf(1);
            let msg = common.buffer.pop();
            msg.should.be.an("object");
            msg.should.have.property("url");
            agendaID = msg.url;
            msg.should.have.property("from", actors[0]);
            msg.should.have.property("type", "create");
        });

        it('should be the appropriate agenda', function (done) {
            chai.request(agendaID)
                .get("")
                .end(function (err, res) {
                    chai.expect(err).to.be.null;
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property("agendaID", agendaID);
                    const agenda = res.body;
                    agenda.should.have.property("participants");
                    agenda.participants.should.be.an("array").and.have.lengthOf(4);
                    agenda.participants[0].should.have.property("id", actors[0]);
                    done();
                });
        });
    });

    describe("actor[0] close the agenda", function () {
        const body = {};
        it('(create body message)', function () {
            body.agendaID = agendaID;
            body.date = newAgenda.dates[0];
        });

        activityHelper.shouldPostActivity(common.agendaOutbox, "/agenda/close", actors[0], agendaSecretary, body);

        activityHelper.shouldReceiveActivity("actor00", common.agendaQuerier, "/agenda/news/new/" + encodeURIComponent(actors[0]), agendaSecretary);

        it('should be a notification', function () {
            common.buffer.should.have.lengthOf(1);
            let msg = common.buffer.pop();
            msg.should.be.an("object");
            msg.should.have.property("url", agendaID);
            msg.should.have.property("type", "close");
            msg.should.have.property("from", actors[0]);
        });

        it('should have an agenda with a selected date', function (done) {
            chai.request(agendaID)
                .get("")
                .end(function (err, res) {
                    chai.expect(err).to.be.null;
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property("agendaID", agendaID);
                    res.body.should.have.property("selectedDate", newAgenda.dates[0])
                    done();
                });
        });
    })

    describe("actor[0] opens the agenda", function () {
        const body = {};
        it('(create body message)', function () {
            body.agendaID = agendaID;
        });

        activityHelper.shouldPostActivity(common.agendaOutbox, "/agenda/open", actors[0], agendaSecretary, body);

        activityHelper.shouldReceiveActivity("actor00", common.agendaQuerier, "/agenda/news/new/" + encodeURIComponent(actors[0]), agendaSecretary);

        it('should be a notification', function () {
            common.buffer.should.have.lengthOf(1);
            let msg = common.buffer.pop();
            common.buffer.pop(); // skip 'create' message
            msg.should.be.an("object");
            msg.should.have.property("url", agendaID);
            msg.should.have.property("type", "open");
            msg.should.have.property("from", actors[0]);
        });

        it('should have an agenda without any selected date', function (done) {
            chai.request(agendaID)
                .get("")
                .end(function (err, res) {
                    chai.expect(err).to.be.null;
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property("agendaID", agendaID);
                    res.body.should.not.have.property("selectedDate")
                    done();
                });
        });
    })

    describe("actor[0] resets the agenda", function () {
        const body = {};

        it('(create body message)', function () {
            body.agendaID = agendaID;
        });

        body.dates = [...newAgenda.dates];
        for (const actor of actors) {
            activityHelper.shouldPostActivity(common.agendaOutbox, "/agenda/vote", actor, agendaSecretary, body);
        }

        activityHelper.shouldPostActivity(common.agendaOutbox, "/agenda/reset", actors[0], agendaSecretary, body);

        it('should have an agenda without any vote', function (done) {
            chai.request(agendaID)
                .get("")
                .end(function (err, res) {
                    chai.expect(err).to.be.null;
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property("agendaID", agendaID);
                    const agenda = res.body;
                    agenda.should.have.property("agendaID");
                    agenda.should.have.property("name", newAgenda.name);
                    agenda.should.have.property("description", newAgenda.description);
                    agenda.should.have.property("dates");
                    agenda.should.have.property("participants");
                    agenda.should.not.have.property("selectedDate");
                    for (const index in agenda.participants) {
                        agenda.participants[index].should.have.property("hasParticipated", false);
                        agenda.participants[index].should.have.property("id", actors[index]);
                    }
                    for (const index in agenda.dates) {
                        agenda.dates[index].should.have.property("forIt");
                        agenda.dates[index].forIt.should.be.an("array").that.is.empty;
                        agenda.dates[index].should.have.property("date", newAgenda.dates[index]);
                    }
                    done()
                });
        });
    })
});
