const common = require("../common");
const chai = common.chai;
const activityHelper = require('../helpers/activityHelper');
const deepEqual = require('deep-equal');
const db = require('../helpers/dbHelper');
const clone = require('clone');

const actors = common.actorsIDs;
const agendaSecretary = common.agendaSecretary;

describe("[Agenda] Validations", function () {
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

    describe("Agenda validation - each field", function () {
        let body = {}

        for (const key of Object.keys(newAgenda)) {
            it('(create the body message: agenda creation with field \'' + key + '\' missing)', function () {
                body = clone(newAgenda);
                delete body[key];
            });

            activityHelper.shouldNotPostActivity(common.agendaOutbox, "/agenda/create", actors[0], common.agendaSecretary, body);
        }
    });

    describe("Agenda validation - empty array", function () {
        let body = {}

        for (const key of ["dates", "with"]) {
            it('(create the body message: agenda creation with empty \'' + key + '\' array)', function () {
                body = clone(newAgenda);
                body[key] = [];
            });

            activityHelper.shouldNotPostActivity(common.agendaOutbox, "/agenda/create", actors[0], common.agendaSecretary, body);
        }
    });

    describe("Vote/Withdraw without agendaID", function () {

        for (const route of ["vote", "withdraw"]) {
            activityHelper.shouldNotPostActivity(common.agendaOutbox, "/agenda/" + route, actors[0], common.agendaSecretary, {});
        }
    });

});
