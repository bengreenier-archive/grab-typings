/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/yargs/yargs.d.ts" />
/// <reference path="../typings/request/request.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />
/// <reference path="../typings/mkdirp/mkdirp.d.ts" />

import * as mkdirp from 'mkdirp';
import * as request from 'request';
import * as yargs from 'yargs';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import {Promise} from 'es6-promise';

/**
 * Represents the entirity of a module(s) query
 */
export interface RunResult {
    installed : string[];
    missing : string[];
    warnings : string[];
}

/**
 * Represents a single status of a module query
 */
export interface RunStatus {
    module: string;
    status ?: number;
    err ?: any;
    content ?: any;
}

/**
 * Represents the default arguments given to
 * the GrabTypings parser when `run()` is called
 */
export interface IDefaultArguments {
    // custom repo source url to use
    s?: string;
    
    // glob selecting files into which you should inject
    i?: string;
    
    // specify typings directory
    d?: string;
}

// internal only - extend argv with our arguments
interface ExtendedArgv extends IDefaultArguments {
    _ : any[];
}

/**
 * Get typings for files
 */
export class GrabTypings {
    /**
     * The default arguments used when `run()` is called
     */
    public static DefaultArguments : IDefaultArguments = {
        s: "https://github.com/borisyankov/DefinitelyTyped/raw/master",
        i: null,
        d: "typings"
    }
    
    private VERSION_STR : string;
    private PROCESS : string;
    
    /**
     * Create a new instance
     */
    public constructor() {
        
        // generating the version string is kind of a pain because of where
        // we compile to. as such, we do some janky stuff here
        var VERSION_STR = "unknown";
        if (fs.existsSync("./package.json")) {
            VERSION_STR = JSON.parse(fs.readFileSync("./package.json").toString()).version;
        } else if (fs.existsSync(__dirname + "/../../package.json")) {
            VERSION_STR = JSON.parse(fs.readFileSync(__dirname + "/../../package.json").toString()).version;
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
    public run(args ?: string[]) : Promise<RunResult> {
        // parse the args into an instance of ExtendedArgv
        var argv = <ExtendedArgv>yargs(args)
            .usage('Usage: '+this.PROCESS+' -s [source] -i [glob] -d [dir] [package(s)]')
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
            .wrap((<any>yargs).terminalWidth())
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
        
        
        var proms : Promise<RunStatus>[] = [];
        
        // get the typings
        modules.forEach((module) => {
            // and store the resulting promise in proms
            proms.push(this.getTyping(module, repoSource));
        });
        
        // return a promise that resolves to a RunResult on success
        // and a specific RunStatus on failure (must be bad failure - not just "missing")
        return new Promise<RunResult>((res, rej) => {
            var result : RunResult = {installed: [], missing: [], warnings: []};
            
            // if they set shouldInject we trigger a warning - until #1 is done
            // but we still proceed with other things
            if (shouldInject) {
                result.warnings.push("injection not yet available");
            }
            
            // process all the get calls
            Promise.all(proms).then((runstat : RunStatus[]) => {
                var runStatPostOps : Promise<void>[] = [];
                
                // for each one
                runstat.forEach((stat) => {
                    // if it has content and status is 200
                    if (stat.content && stat.status === 200) {
                        // schedule post op to write it to writeTo
                        runStatPostOps.push(this.installModuleDef(stat.module, stat.content, writeTo).then(() => {
                            result.installed.push(stat.module);
                        }));
                    // if status isn't 200
                    } else {
                        // then record it as missing
                        result.missing.push(stat.module);
                    }
                });
                
                // after processing all the calls, resolve the promise
                Promise.all(runStatPostOps).then(() => {
                   res(result); 
                }, (bad:any) => {
                    rej(bad);
                });
            // and handle any bad failures by rejecting the bad RunStatus
            }, function (runstat : RunStatus) {
                rej(runstat);
            });
        });
    }
    
    private getTyping(module : string, repoSource: string) : Promise<RunStatus> {
        return new Promise<RunStatus>((res, rej) => {
            // make request
            request(url.format(url.parse(repoSource+path.normalize("/"+module+"/"+module+".d.ts"))), (err, response, body) => {
                // handle request
                if (err) return rej({err: err, module: module});
                else if (response.statusCode !== 200) return res({status: response.statusCode, module: module});
                else return res({content: body, status: response.statusCode, module: module});
            });
        });
    }
    
    private installModuleDef(module : string, data: any, dir : string) : Promise<void> {
        var pth = path.normalize(dir+"/"+module+"/"+module+".d.ts");
        return new Promise<void>((res, rej) => {
            fs.exists(pth, (exists) => {
                if (exists) return res(null);
                else mkdirp(path.dirname(pth), (err) => {
                    if (err) return rej(err);
                    else fs.writeFile(pth, data, (err) => {
                        if (err) return rej(err);
                        else return res(null);
                    });
                });
            });
        });
    }
}