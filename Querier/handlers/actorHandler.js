const axios = require("axios");

function getInboxAddresses(userIDs) {
    let promises = [];
    if (!Array.isArray(userIDs)) userIDs = [userIDs];

    for (const id of userIDs) promises.push(
        axios.get(id)
            .then(actor => {return actor.data.data.inbox})
            .catch(_ => {}) // ignore the incorrect actors
    );

    return Promise.all(promises).then(addresses => {
        return addresses.filter(addr => addr !== undefined)
    });
}

module.exports = {
    getInboxAddresses,
};
