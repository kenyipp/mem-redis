"use strict";
const util = require("util");

function promisify(client) {
    const get = client.get;
    client.get = util.promisify(get).bind(client);
    const set = client.set;
    client.set = util.promisify(set).bind(client);
    const setex = client.setex;
    client.setex = util.promisify(setex).bind(client);
    const keys = client.keys;
    client.keys = util.promisify(keys).bind(client);
    const del = client.del;
    client.del = util.promisify(del).bind(client);
    return client;
}

module.exports = promisify;