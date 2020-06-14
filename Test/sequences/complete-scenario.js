const common = require("../common");
const chai = common.chai;
const activityHelper = require('../helpers/activityHelper');
const deepEqual = require('deep-equal');
const db = require('../helpers/dbHelper');

const actors = common.actorsIDs;
const agendaSecretary = common.agendaSecretary;

describe("[Agenda] Complete scenario", function () {
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

    it("should get the secretary's profile", function (done) {
        chai.request(agendaSecretary)
            .get("/")
            .end(function (err, res) {
                chai.expect(err).to.be.null;
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property("inbox");
                res.body.should.have.property("id");
                res.body.should.have.property("type", "Application");
                done();
            });
    });

    describe("actor[0] sends a message to secretary", function () {
        activityHelper.shouldPostActivity(common.agendaOutbox, "/agenda/create", actors[0], common.agendaSecretary, newAgenda);
    });

    describe("actors 0..3 receive the same secretary's message", function () {

        for (var i = 0; i < 4; i++) {
            activityHelper.shouldReceiveActivity("actor0" + i, common.agendaQuerier, "/agenda/news/new/" + encodeURIComponent(actors[i]), agendaSecretary);
        }

        it('should be the same message', function () {
            common.buffer.should.have.lengthOf(4);
            let msg01 = common.buffer.pop();
            while (common.buffer.length > 0) {
                let msg02 = common.buffer.pop();
                deepEqual(msg01, msg02).should.be.true;
            }
            common.buffer.push(msg01);
        });
    })

    describe("the secretary's message announces a new agenda", function () {
        it('should have the appropriate structure', function (done) {
            const msg = common.buffer.pop();
            msg.should.have.property("type", "create");
            msg.should.have.property("from", actors[0]);
            msg.should.have.property("url");
            common.buffer.push(msg.url);
            done();
        });

        it('should contains a valid agenda URL', function (done) {
            const url = common.buffer.pop();
            chai.request(url)
                .get("")
                .end(function (err, res) {
                    chai.expect(err).to.be.null;
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property("agendaID", url);
                    agendaID = res.body.agendaID;
                    common.buffer.push(res.body);
                    done()
                });
        });

        it('should correspond to data sent by actor[0]', function (done) {
            const agenda = common.buffer.pop();
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
            done();
        });
    });

    describe("actor[0] votes for all dates", function () {
        const body = {}
        it('(create the body message)', function () {
            body.agendaID = agendaID;
            body.dates = [...newAgenda.dates];
        });
        activityHelper.shouldPostActivity(common.agendaOutbox, "/agenda/vote", actors[0], common.agendaSecretary, body);
    })

    describe("actor[1] votes for one date", function () {
        const body = {}
        it('(create the body message)', function () {
            body.agendaID = agendaID;
            body.dates = [newAgenda.dates[0]];
        });
        activityHelper.shouldPostActivity(common.agendaOutbox, "/agenda/vote", actors[1], common.agendaSecretary, body);
    })

    describe("actor[2] votes for two dates", function () {
        const body = {}
        it('(create the body message)', function () {
            body.agendaID = agendaID;
            body.dates = [newAgenda.dates[0], newAgenda.dates[1]];
        });
        activityHelper.shouldPostActivity(common.agendaOutbox, "/agenda/vote", actors[2], common.agendaSecretary, body);
    })

    describe("actor[3] votes for none", function () {
        const body = {}
        it('(create the body message)', function () {
            body.agendaID = agendaID;
            body.dates = [];
        });
        activityHelper.shouldPostActivity(common.agendaOutbox, "/agenda/vote", actors[3], common.agendaSecretary, body);
    })

    describe("actor[0] receives a notification for each vote", function () {
        activityHelper.shouldReceiveActivity("actor00", common.agendaQuerier, "/agenda/news/new/" + encodeURIComponent(actors[0]), agendaSecretary);

        it('should be 4 messages, one for each actor\'s vote', function () {
            common.buffer.should.have.lengthOf(4);
            let msg;
            for (var i = 3; i >= 0; i--) { // reverse since the buffer is a stack
                msg = common.buffer.pop();
                msg.should.be.an("object");
                msg.should.have.property("url", agendaID);
                msg.should.have.property("type", "vote");
                msg.should.have.property("from", actors[i]);
            }
        });
    })

    describe('agenda is up to date (vote applied)', function () {
        it('should return the agenda content', function (done) {
            chai.request(agendaID)
                .get("")
                .end(function (err, res) {
                    chai.expect(err).to.be.null;
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property("agendaID", agendaID);
                    common.buffer.push(res.body);
                    done()
                });
        });

        it('should respect the four votes', function () {
            const agenda = common.buffer.pop();
            for (const index in agenda.participants) {
                agenda.participants[index].should.have.property("hasParticipated", true);
                agenda.participants[index].should.have.property("id", actors[index]);
            }
            const dates = agenda.dates;
            dates.should.be.an("array");
            dates[0].forIt.should.be.an('array').that.have.lengthOf(3);
            dates[0].forIt.should.include(actors[0])
            dates[0].forIt.should.include(actors[1])
            dates[0].forIt.should.include(actors[2])
            dates[1].forIt.should.be.an('array').that.have.lengthOf(2);
            dates[1].forIt.should.include(actors[0])
            dates[1].forIt.should.include(actors[2])
            dates[2].forIt.should.be.an('array').that.have.lengthOf(1);
            dates[2].forIt.should.include(actors[0])
            dates[3].forIt.should.be.an('array').that.have.lengthOf(1);
            dates[3].forIt.should.include(actors[0])
        });
    });

    describe("actor[0] closes the agenda", function () {
        const body = {};
        it('(create body message)', function () {
            body.agendaID = agendaID;
            body.date = newAgenda.dates[0];
        });

        activityHelper.shouldPostActivity(common.agendaOutbox, "/agenda/close", actors[0], agendaSecretary, body);
    })

    describe("actor[0] receives a notification for the 'close' action", function () {
        activityHelper.shouldReceiveActivity("actor00", common.agendaQuerier, "/agenda/news/new/" + encodeURIComponent(actors[0]), agendaSecretary);

        it('should have the appropriate information', function () {
            common.buffer.should.have.lengthOf(1);
            let msg = common.buffer.pop();
            msg.should.be.an("object");
            msg.should.have.property("url", agendaID);
            msg.should.have.property("type", "close");
            msg.should.have.property("from", actors[0]);
        });
    })

    describe("each participant receives two notifications (vote, close)", function () {
        for (var i = 1; i < 4; i++) {
            const index = i;
            activityHelper.shouldReceiveActivity("actor0" + index, common.agendaQuerier, "/agenda/news/new/" + encodeURIComponent(actors[index]), agendaSecretary);

            it('should be a vote and a close', function () {
                common.buffer.should.have.lengthOf(2);
                const close = common.buffer.pop();
                const vote = common.buffer.pop();
                close.should.have.property("url", agendaID);
                close.should.have.property("type", "close");
                close.should.have.property("from", actors[0]);
                vote.should.have.property("url", agendaID);
                vote.should.have.property("type", "vote");
                vote.should.have.property("from", actors[index]);
            });
        }
    })

    describe('agenda is up to date (close applied)', function () {
        it('should return the agenda content', function (done) {
            chai.request(agendaID)
                .get("")
                .end(function (err, res) {
                    chai.expect(err).to.be.null;
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property("agendaID", agendaID);
                    common.buffer.push(res.body);
                    done();
                });
        });

        it('should be closed', function () {
            const agenda = common.buffer.pop();
            agenda.should.have.property("selectedDate", newAgenda.dates[0]);
        });
    });
});
