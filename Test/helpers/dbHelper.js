const MongoClient = require('mongodb').MongoClient;

function cleanAux(url, collections) {
    // Use connect method to connect to the server
    return MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true})
        .then(function (client) {
            const promises = [];
            for (const collection of collections) promises.push(
                client.db("querier").collection(collection).deleteMany({})
            )
            return Promise.all(promises)
                .then(_ => {
                    return client.close(true)
                });
        });
}

function cleanAgendaQuerierDB() {
    let port = process.env.AGENDA_QUERIER_DB_PORTS.split("-")[0];
    return cleanAux('mongodb://' + process.env.HOST + ':' + port, ["agendas","messages","news"]);
}

module.exports = {
    cleanAgendaQuerierDB,
}
