const wolkenkit = require('wolkenkit-client');

var _eventStore;

async function connect() {
    _eventStore = await wolkenkit.connect({ host: 'local.wolkenkit.io', port: 4000 });
}

function get() {
    return _eventStore;
}

module.exports = {connect, get};
