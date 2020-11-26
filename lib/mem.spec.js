"use strict";
const delay = require("delay");
const mem = require("./mem");

beforeEach(async () => {
    console.log("[mem] Flush the cache before test cases");
    await mem.flush();
});

afterAll(async () => {
    console.log("[mem] Flush the cache after all test cases");
    await mem.flush();
    return mem.getClient().quit();
});

it("should cache the result", async () => {

    let testFunction = (function () {
        let count = 0;
        return async function () {
            return count++;
        };
    })();

    testFunction = mem(testFunction);

    const first = await testFunction("foo");
    const second = await testFunction("foo");

    expect(first).toEqual(second);

    const third = await testFunction("bar");

    expect(second).not.toEqual(third);
});

it("should expire after maxAge", async function () {

    let testFunction = (function () {
        let count = 0;
        return async function () {
            return count++;
        };
    })();

    testFunction = mem(testFunction, { maxAge: 1000 });

    const first = await testFunction("foo");

    await delay(1000);

    const second = await testFunction("foo");

    expect(first).not.toEqual(second);

    const third = await testFunction("foo");

    expect(third).toEqual(second);
});
