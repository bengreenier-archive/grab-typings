/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/del/del.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />

import {Promise} from 'es6-promise';
import * as assert from 'assert';
import * as fs from 'fs';
import * as del from 'del';
import {GrabTypings, RunResult, RunStatus} from '../lib/index';

describe("GrabTypings", () => {
    it("should be constructable", () => {
        // look! a useless test! yay!
        assert.doesNotThrow(() => {
            new GrabTypings();
        });
    });
    
    it("should warn that injection isn't ready yet", (done) => {
        // note - we should remove this when #1 is resolved
        var i = new GrabTypings();
        
        // note - we just let this actually install to typings/
        i.run(["-i","**/*.ts","mocha"]).then((rr : RunResult) => {
            assert.equal(rr.installed.indexOf("mocha"), 0);
            assert.equal(rr.missing.length, 0);

            assert.equal(rr.warnings.length, 1);
            assert.equal(rr.warnings[0], "injection not yet available");
            done();
        });
    });
    
    it("should grab mocha", (done) => {
        var i = new GrabTypings();
        // note - we just let this actually install to typings/
        i.run(["mocha"]).then((rr : RunResult) => {
            assert.equal(rr.installed.indexOf("mocha"), 0);
            done();
        });
    });
    
    it("should grab request + deps", (done) => {
        var i = new GrabTypings();
        // note - we just let this actually install to typings/
        i.run(["request"]).then((rr : RunResult) => {
            assert.notEqual(rr.installed.indexOf("node"), -1);
            assert.notEqual(rr.installed.indexOf("request"), -1);
            assert.notEqual(rr.installed.indexOf("form-data"), -1);
            done();
        });
    });
    
    it("should grab mocha from alt source", (done) => {
        var i = new GrabTypings();
        // note - we just let this actually install to typings/
        i.run(["mocha","-r","https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master"])
            .then((rr : RunResult) => {
            assert.equal(rr.installed.indexOf("mocha"), 0);
            assert.equal(rr.warnings.length, 0);
            assert.equal(rr.missing.length, 0);
            done();
       });
    });
    
    it("should allow alt directories", (done) => {
        var i = new GrabTypings();
        
        // mock out the install module internal to assert that dir is as expected
        // note - this won't write to disk
        (<any>i).installModuleDef = (module : string, data : any, dir : string) : Promise<string> => {
            return new Promise<string>((res, rej) => {
                if (dir === "alt") {
                    res(module);
                } else {
                    rej(new Error("directory("+dir+") wasn't `alt`"));
                }
            });
        };
        
        i.run(["mocha","-d","alt"]).then((rr : RunResult) => {
            assert.equal(rr.installed.indexOf("mocha"), 0);
            assert.equal(rr.warnings.length, 0);
            assert.equal(rr.missing.length, 0);
            done();
       }, done);
    });
});

describe("GrabTypings internals", () => {
    it("should handle empty installModuleDef ok", (done) => {
        // note - this writes to typings/__test__ with garbage
        // but we clean it up when we're done
        var cleanup = (...args : any[]) => {
            if (fs.existsSync("typings/__test__/__test__.d.ts")) {
                assert.equal(fs.readFileSync("typings/__test__/__test__.d.ts").toString(), "test data");
                del.sync("typings/__test__", {force: true});
                done();
            } else {
                done(new Error("test data not written"));
            }
        };
        (<any>GrabTypings.prototype).installModuleDef("__test__", "test data", "typings").then(cleanup, cleanup);
    });
    it("should handle downloading ok", (done) => {
        var defaultSource = GrabTypings.DefaultArguments.s;
        // note - this won't write to disk
        (<any>GrabTypings.prototype).getTyping("mocha", defaultSource).then((stat : RunStatus) => {
            assert.equal(stat.status, 200);
            assert.equal(stat.module, "mocha");
            assert.equal(stat.err, null);
            done();
        },done);
    });
    it("should handle scanning internal deps ok", (done) => {
        var defaultSource = GrabTypings.DefaultArguments.s;
        // note - this won't write to disk
        // we get request as we know the typings for request depends on form-data
        // so we can validate internal dep scanning off that (cuz lazy)
        (<any>GrabTypings.prototype).getTyping("request", defaultSource).then((stat : RunStatus) => {
            assert.equal(stat.status, 200);
            assert.equal(stat.err, null);
            
            (<any>GrabTypings.prototype).scanDepDeps(stat.content).then((deps : string[]) => {
                // since this is hard coded, if the request module typings change this test will fail
                // TODO: use mock data to avoid this (todo cuz lazy)
                assert.deepEqual(deps, ["node", "form-data"]);
                done();
            }, done);
        },done);
    });
})