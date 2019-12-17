const eventStoreClient = require('event-store-client');

var es = undefined;

var config = {
    'eventStore': {
        'address': "127.0.0.1",
        'port': 1113,
        'stream': '$stats-127.0.0.1:2113',
        'credentials': {
            'username': "admin",
            'password': "changeit"
        }
    },
    'debug': false
};

var options = {
    host: config.eventStore.address,
    port: config.eventStore.port,
    debug: config.debug,
    onConnect: () => console.log("Connected to EventStore !"),
    onError: (err) => {
        console.error("EventStore connection impossible (" + err + ")");
        process.exit(1);
    },
    onClose: () => {
        console.error("Connection with EventStore lost.");
        process.exit(1);
    }
};

function getES() {
    if (es === undefined) es = new eventStoreClient.Connection(options);
    return es;
}

function close() {
    if (es !== undefined) {
        es.close();
        es = undefined;
    }
}

function getCredentials() {
    return config.eventStore.credentials;
}

function getNewID() {
    return eventStoreClient.Connection.createGuid();
}

function getExpectedVersion() {
    return eventStoreClient.ExpectedVersion.Any;
}

module.exports = { getES, getCredentials, getNewID, getExpectedVersion, close };
