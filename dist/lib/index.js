/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/yargs/yargs.d.ts" />
/// <reference path="../typings/request/request.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />
/// <reference path="../typings/mkdirp/mkdirp.d.ts" />
var mkdirp = require('mkdirp');
var request = require('request');
var yargs = require('yargs');
var path = require('path');
var url = require('url');
var fs = require('fs');
var es6_promise_1 = require('es6-promise');
/**
 * Get typings for files
 */
var GrabTypings = (function () {
    /**
     * Create a new instance
     */
    function GrabTypings() {
        // generating the version string is kind of a pain because of where
        // we compile to. as such, we do some janky stuff here
        var VERSION_STR = "unknown";
        if (fs.existsSync("./package.json")) {
            VERSION_STR = JSON.parse(fs.readFileSync("./package.json").toString()).version;
        }
        else if (fs.existsSync("../../package.json")) {
            VERSION_STR = JSON.parse(fs.readFileSync("../../package.json").toString()).version;
        }
        this.VERSION_STR = VERSION_STR;
        // determining what to write in the usage string is tricky on windows
        // because grab-typings.cmd isn't the source, <path/to/node> <path/to/gt.js> is
        // to get around that, we change the usage string if we're on windows
        var PROCESS = "$0";
        if (process.platform === "win32") {
            PROCESS = "grab-typings||gt";
        }
        this.PROCESS = PROCESS;
    }
    /**
     * Run grab-typings logic
     */
    GrabTypings.prototype.run = function (args) {
        var _this = this;
        // parse the args into an instance of ExtendedArgv
        var argv = yargs(args)
            .usage('Usage: ' + this.PROCESS + ' -s [source] -i [glob] -d [dir] [package(s)]')
            .alias('s', 'source')
            .string('s')
            .describe('s', 'Specify a source')
            .alias('d', 'dir')
            .string('d')
            .describe('d', 'Specify typings directory to save to')
            .alias('i', 'inject')
            .string('i')
            .describe('i', 'Inject references into files that match [glob]')
            .help('h')
            .alias('h', 'help')
            .epilog("Made with <3 by @bengreenier")
            .version(this.VERSION_STR)
            .wrap(yargs.terminalWidth())
            .default(GrabTypings.DefaultArguments)
            .argv;
        // since ExtendedArgv has bad var names, we parse them out
        var modules = argv._;
        var repoSource = argv.s;
        var shouldInject = argv.i;
        var writeTo = argv.d;
        // if there are no modules passed, we want to read from package.json
        if (modules.length === 0) {
            var pkgPath = path.normalize(process.cwd() + "/package.json");
            if (fs.existsSync(pkgPath)) {
                // require package.json from the cwd
                var pkg = require(pkgPath);
                // fill out the modules array
                modules = ["node"];
                for (var prop in pkg["dependencies"]) {
                    modules.push(prop);
                }
                for (var prop in pkg["devDependencies"]) {
                    modules.push(prop);
                }
            }
        }
        var proms = [];
        // get the typings
        modules.forEach(function (module) {
            // and store the resulting promise in proms
            proms.push(_this.getTyping(module, repoSource));
        });
        // return a promise that resolves to a RunResult on success
        // and a specific RunStatus on failure (must be bad failure - not just "missing")
        return new es6_promise_1.Promise(function (res, rej) {
            var result = { installed: [], missing: [], warnings: [] };
            // if they set shouldInject we trigger a warning - until #1 is done
            // but we still proceed with other things
            if (shouldInject) {
                result.warnings.push("injection not yet available");
            }
            // process all the get calls
            es6_promise_1.Promise.all(proms).then(function (runstat) {
                var runStatPostOps = [];
                // for each one
                runstat.forEach(function (stat) {
                    // if it has content and status is 200
                    if (stat.content && stat.status === 200) {
                        // schedule post op to write it to writeTo
                        runStatPostOps.push(_this.installModuleDef(stat.module, stat.content, writeTo).then(function () {
                            result.installed.push(stat.module);
                        }));
                    }
                    else {
                        // then record it as missing
                        result.missing.push(stat.module);
                    }
                });
                // after processing all the calls, resolve the promise
                es6_promise_1.Promise.all(runStatPostOps).then(function () {
                    res(result);
                }, function (bad) {
                    rej(bad);
                });
                // and handle any bad failures by rejecting the bad RunStatus
            }, function (runstat) {
                rej(runstat);
            });
        });
    };
    GrabTypings.prototype.getTyping = function (module, repoSource) {
        return new es6_promise_1.Promise(function (res, rej) {
            // make request
            request(url.format(url.parse(repoSource + path.normalize("/" + module + "/" + module + ".d.ts"))), function (err, response, body) {
                // handle request
                if (err)
                    return rej({ err: err, module: module });
                else if (response.statusCode !== 200)
                    return res({ status: response.statusCode, module: module });
                else
                    return res({ content: body, status: response.statusCode, module: module });
            });
        });
    };
    GrabTypings.prototype.installModuleDef = function (module, data, dir) {
        var pth = path.normalize(dir + "/" + module + "/" + module + ".d.ts");
        return new es6_promise_1.Promise(function (res, rej) {
            fs.exists(pth, function (exists) {
                if (exists)
                    return res(null);
                else
                    mkdirp(path.dirname(pth), function (err) {
                        if (err)
                            return rej(err);
                        else
                            fs.writeFile(pth, data, function (err) {
                                if (err)
                                    return rej(err);
                                else
                                    return res(null);
                            });
                    });
            });
        });
    };
    /**
     * The default arguments used when `run()` is called
     */
    GrabTypings.DefaultArguments = {
        s: "https://github.com/borisyankov/DefinitelyTyped/raw/master",
        i: null,
        d: "typings"
    };
    return GrabTypings;
})();
exports.GrabTypings = GrabTypings;
