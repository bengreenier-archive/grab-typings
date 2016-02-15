#!/usr/bin/env node
/// <reference path="../typings/chalk/chalk.d.ts" />
/// <reference path="../typings/node/node.d.ts" />

import * as GT from './';
import * as chalk from 'chalk';

/**
 * A simple little command line version
 */
new GT.GrabTypings().run(process.argv.slice(2)).then((rr : GT.RunResult) => {
    
    // totall installed/total
    console.log(rr.installed.length+"/"+(rr.missing.length+rr.installed.length));
    
    rr.installed.forEach((m : string) => {
        // checkmark <module>
        console.log(chalk.green("\u2713 ")+m);
    });
    rr.warnings.forEach((message : string) => {
        console.warn(chalk.yellow(message));
    });
    rr.missing.forEach((m : string) => {
        // x <module>
        console.error(chalk.red("\u2718 ")+m);
    });
}, (err : any) => {
    console.error("Oops - something went wrong...", err);
});