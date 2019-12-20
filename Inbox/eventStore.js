const eventStore = require('node-eventstore-client');
const uuid = require('uuid');

var esClient = undefined;

function getClient() {
    if (esClient === undefined) {
        var connSettings = {};  // Use defaults
        esClient = eventStore.createConnection(connSettings, "tcp://localhost:1113", "AgendaModule");
        esClient.connect();
        esClient.once('connected', function (tcpEndPoint) {
            console.log('Connected to eventstore at ' + tcpEndPoint.host + ":" + tcpEndPoint.port);
        });
        esClient.once('disconnected', noEventStoreConnection);
        esClient.once('closed', noEventStoreConnection);
    }
    return esClient;
}

function close() {
    if (esClient !== undefined) {
        esClient.close();
        esClient = undefined;
    }
}

function noEventStoreConnection() {
    console.error("An error occurred with the EventStore connection");
    process.exit(1);
}

module.exports = { getClient };
