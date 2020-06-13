const common = require("../common");
const chai = common.chai;
const activityHelper = require('../helpers/activityHelper');
const db = require('../helpers/dbHelper');

const actors = common.actorsIDs;
const agendaSecretary = common.agendaSecretary;

describe("[Agenda] Some interactions refused", function () {
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

    describe("actor[1] can not close the agenda", function () {
        const body = {};
        it('(create body message)', function () {
            body.agendaID = agendaID;
            body.date = newAgenda.dates[0];
        });

        activityHelper.shouldPostActivity(common.agendaOutbox, "/agenda/close", actors[1], agendaSecretary, body);

        activityHelper.shouldReceiveActivity("actor01", common.agendaQuerier, "/agenda/news/new/" + encodeURIComponent(actors[1]), agendaSecretary);

        it('should be an error message', function () {
            common.buffer.should.have.lengthOf(2);
            let msg = common.buffer.pop();
            common.buffer.pop(); // skip 'create' message
            msg.should.be.an("object");
            msg.should.have.property("url", agendaID);
            msg.should.have.property("type", "error");
            msg.should.have.property("error");
            const error = msg.error;
            const div = error.split(":::");
            div.should.have.lengthOf(2);
            div[0].should.be.equal("close");
        });
    })

    describe("actor[2] can not reset the agenda", function () {
        const body = {};
        it('(create body message)', function () {
            body.agendaID = agendaID;
        });

        activityHelper.shouldPostActivity(common.agendaOutbox, "/agenda/reset", actors[2], agendaSecretary, body);

        activityHelper.shouldReceiveActivity("actor02", common.agendaQuerier, "/agenda/news/new/" + encodeURIComponent(actors[2]), agendaSecretary);

        it('should be an error message', function () {
            common.buffer.should.have.lengthOf(2);
            let msg = common.buffer.pop();
            common.buffer.pop(); // skip 'create' message
            msg.should.be.an("object");
            msg.should.have.property("url", agendaID);
            msg.should.have.property("type", "error");
            msg.should.have.property("error");
            const error = msg.error;
            const div = error.split(":::");
            div.should.have.lengthOf(2);
            div[0].should.be.equal("reset");
        });
    })

    describe("(actor[0] closes the agenda)", function () {
        const body = {};

        it('(create message body)', function () {
            body.agendaID = agendaID;
            body.date = newAgenda.dates[0];
        });

        activityHelper.shouldPostActivity(common.agendaOutbox, "/agenda/close", actors[0], agendaSecretary, body);
    });

    describe("actor[2] can not open the agenda", function () {
        const body = {};
        it('(create body message)', function () {
            body.agendaID = agendaID;
        });

        activityHelper.shouldPostActivity(common.agendaOutbox, "/agenda/open", actors[2], agendaSecretary, body);

        activityHelper.shouldReceiveActivity("actor02", common.agendaQuerier, "/agenda/news/new/" + encodeURIComponent(actors[2]), agendaSecretary);

        it('should be an error message', function () {
            common.buffer.should.have.lengthOf(2);
            let msg = common.buffer.pop();
            msg.should.be.an("object");
            msg.should.have.property("url", agendaID);
            msg.should.have.property("type", "error");
            msg.should.have.property("error");
            const error = msg.error;
            const div = error.split(":::");
            div.should.have.lengthOf(2);
            div[0].should.be.equal("open");
        });
    })

    describe("actor[2] can not vote (closed agenda)", function () {
        const body = {};
        it('(create body message)', function () {
            body.agendaID = agendaID;
            body.dates = [newAgenda.dates[0]];
        });

        activityHelper.shouldPostActivity(common.agendaOutbox, "/agenda/vote", actors[2], agendaSecretary, body);

        activityHelper.shouldReceiveActivity("actor02", common.agendaQuerier, "/agenda/news/new/" + encodeURIComponent(actors[2]), agendaSecretary);

        it('should be an error message', function () {
            common.buffer.should.have.lengthOf(2);
            let msg = common.buffer.pop();
            common.buffer.pop(); // skip 'close' notification
            msg.should.be.an("object");
            msg.should.have.property("url", agendaID);
            msg.should.have.property("type", "error");
            msg.should.have.property("error");
            const error = msg.error;
            const div = error.split(":::");
            div.should.have.lengthOf(2);
            div[0].should.be.equal("vote");
        });
    })


});
