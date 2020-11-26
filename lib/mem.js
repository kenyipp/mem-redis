"use strict";
const md5 = require("md5");
const redis = require("redis");
const mimicFn = require("mimic-fn");
const promisify = require("../utils/redis-promisify");

var client = promisify(redis.createClient(process.env.REDIS_CONNECTION_STRING));
const cacheStore = new WeakMap();

function connect(url, options = {}) {
    client = null;
    client = promisify(redis.createClient(url, options));
}

const mem = (fn, { cacheKey, maxAge, prefix = "mem" } = {}) => {

    const id = md5(fn.toString());

    const memoized = async function (...arguments_) {

        const key = [
            prefix,
            id,
            cacheKey ? cacheKey(arguments_) : typeof arguments_[0] === "object" ? md5(JSON.stringify(arguments_[0])) : arguments_[0]
        ].join("_");

        const cacheItem = await client.get(key);

        if (cacheItem)
            return JSON.parse(cacheItem).data;

        const result = await fn.apply(this, arguments_);

        if (maxAge)
            await client.setex(key, ~~(maxAge / 1000), JSON.stringify({ data: result }));
        else
            await client.set(key, JSON.stringify({ data: result }));

        return result;
    };

    try {
        mimicFn(memoized, fn);
    } catch (error) { }

    cacheStore.set(memoized, [prefix, id].join("_"));

    return memoized;
};


async function clear(fn) {

    if (!cacheStore.has(fn))
        throw new Error("Can't clear a function that was not memoized!");

    const prefix = cacheStore.get(fn);
    await client.del(await client.keys(prefix + "*"));

    return "OK";
}

function flush() {
    return client
        .keys("mem*")
        .then(keys => client.del(keys))
        .catch(error => {/** */ });
}

module.exports = mem;
module.exports.connect = connect;
module.exports.clear = clear;
module.exports.flush = flush;
module.exports.getClient = () => client;