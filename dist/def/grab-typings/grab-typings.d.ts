/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/yargs/yargs.d.ts" />
/// <reference path="../typings/request/request.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />
/// <reference path="../typings/mkdirp/mkdirp.d.ts" />
/**
 * Represents the entirity of a module(s) query
 */
export interface RunResult {
    installed: string[];
    missing: string[];
    warnings: string[];
}
/**
 * Represents a single status of a module query
 */
export interface RunStatus {
    module: string;
    status?: number;
    err?: any;
    content?: any;
}
/**
 * Represents the default arguments given to
 * the GrabTypings parser when `run()` is called
 */
export interface IDefaultArguments {
    s?: string;
    i?: string;
    d?: string;
}
/**
 * Get typings for files
 */
export declare class GrabTypings {
    /**
     * The default arguments used when `run()` is called
     */
    static DefaultArguments: IDefaultArguments;
    private VERSION_STR;
    private PROCESS;
    /**
     * Create a new instance
     */
    constructor();
    /**
     * Run grab-typings logic
     */
    run(args?: string[]): Promise<RunResult>;
    private getTyping(module, repoSource);
    private installModuleDef(module, data, dir);
    private scanDepDeps(data);
}
