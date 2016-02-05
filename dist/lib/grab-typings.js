#!/usr/bin/env node
var GT = require('./');
/**
 * A simple little command line version
 */
new GT.GrabTypings().run(process.argv.slice(2)).then(function (rr) {
    // totall installed/total
    console.log(rr.installed.length + "/" + (rr.missing.length + rr.installed.length));
    rr.installed.forEach(function (m) {
        // checkmark <module>
        console.log("\u2713 " + m);
    });
    rr.warnings.forEach(function (message) {
        console.warn(message);
    });
    rr.missing.forEach(function (m) {
        // x <module>
        console.error("\u2718 " + m);
    });
}, function (err) {
    console.error("Oops - something went wrong...", err);
});
