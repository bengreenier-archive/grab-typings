/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/del/del.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />
var es6_promise_1 = require('es6-promise');
var assert = require('assert');
var fs = require('fs');
var del = require('del');
var index_1 = require('../lib/index');
describe("GrabTypings", function () {
    it("should be constructable", function () {
        // look! a useless test! yay!
        assert.doesNotThrow(function () {
            new index_1.GrabTypings();
        });
    });
    it("should warn that injection isn't ready yet", function (done) {
        // note - we should remove this when #1 is resolved
        var i = new index_1.GrabTypings();
        // note - we just let this actually install to typings/
        i.run(["-i", "**/*.ts", "mocha"]).then(function (rr) {
            assert.equal(rr.installed.indexOf("mocha"), 0);
            assert.equal(rr.missing.length, 0);
            assert.equal(rr.warnings.length, 1);
            assert.equal(rr.warnings[0], "injection not yet available");
            done();
        });
    });
    it("should grab mocha", function (done) {
        var i = new index_1.GrabTypings();
        // note - we just let this actually install to typings/
        i.run(["mocha"]).then(function (rr) {
            assert.equal(rr.installed.indexOf("mocha"), 0);
            done();
        });
    });
    it("should grab mocha from alt source", function (done) {
        var i = new index_1.GrabTypings();
        // note - we just let this actually install to typings/
        i.run(["mocha", "-r", "https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master"])
            .then(function (rr) {
            assert.equal(rr.installed.indexOf("mocha"), 0);
            assert.equal(rr.warnings.length, 0);
            assert.equal(rr.missing.length, 0);
            done();
        });
    });
    it("should allow alt directories", function (done) {
        var i = new index_1.GrabTypings();
        // mock out the install module internal to assert that dir is as expected
        // note - this won't write to disk
        i.installModuleDef = function (module, data, dir) {
            return new es6_promise_1.Promise(function (res, rej) {
                if (dir === "alt") {
                    res(null);
                }
                else {
                    rej(new Error("directory(" + dir + ") wasn't `alt`"));
                }
            });
        };
        i.run(["mocha", "-d", "alt"]).then(function (rr) {
            assert.equal(rr.installed.indexOf("mocha"), 0);
            assert.equal(rr.warnings.length, 0);
            assert.equal(rr.missing.length, 0);
            done();
        }, done);
    });
});
describe("GrabTypings internals", function () {
    it("should handle empty installModuleDef ok", function (done) {
        // note - this writes to typings/__test__ with garbage
        // but we clean it up when we're done
        var cleanup = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            if (fs.existsSync("typings/__test__/__test__.d.ts")) {
                assert.equal(fs.readFileSync("typings/__test__/__test__.d.ts").toString(), "test data");
                del.sync("typings/__test__", { force: true });
                done();
            }
            else {
                done(new Error("test data not written"));
            }
        };
        index_1.GrabTypings.prototype.installModuleDef("__test__", "test data", "typings").then(cleanup, cleanup);
    });
    it("should handle downloading ok", function (done) {
        var defaultSource = index_1.GrabTypings.DefaultArguments.s;
        // note - this won't write to disk
        index_1.GrabTypings.prototype.getTyping("mocha", defaultSource).then(function (stat) {
            assert.equal(stat.status, 200);
            assert.equal(stat.module, "mocha");
            assert.equal(stat.err, null);
            done();
        }, done);
    });
});
