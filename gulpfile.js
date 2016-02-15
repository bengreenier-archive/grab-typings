var gulp = require('gulp');
var ts = require('gulp-typescript');
var del = require('del');
var fs = require('fs');
var mocha = require('gulp-mocha');
var merge2 = require('merge2');
var flatten = require('gulp-flatten');
var rename = require('gulp-rename');
var replace = require('gulp-replace');

/**
 * Configure your build here
 */
var config = {
    dest: './dist',
    port: process.env.PORT || 1337
};

/**
 * build the typescript
 * 
 * tsconfig.json in project root
 */
gulp.task('compile:lib', ['cleanup:dest'], function() {
    var tsconfig = "./tsconfig.json";
    
    var tsproj = ts.createProject(tsconfig, {declaration: true});
    var tsres = gulp.src("lib/**/*.ts").pipe(ts(tsproj));
    return merge2([
        tsres.js.pipe(gulp.dest(config.dest+'/lib', {overwrite: true})),
        tsres.dts.pipe(rename(function (path) {
            // rename index.d to grab-typings.d
            // rename grab-typings.d to cli.d
            if (path.basename === 'index.d') {
                path.basename = "grab-typings.d";
            } else if (path.basename === 'grab-typings.d') {
                path.basename = "cli.d";
            }
        }))
        .pipe(replace(/\/\/\/\s<reference path=\"(.+)\"/g, function (matched, thing1) {
            if (thing1.indexOf("../typings") === 0) {
                thing1 = thing1.replace("../typings", "..");
            }
            return '/// reference path="'+thing1+'">';
        }))
        .pipe(flatten({
            newPath: 'grab-typings'
        })).pipe(gulp.dest(config.dest+'/def', {overwrite: true}))
    ]);
});

/**
 * build the test typescript
 * 
 * tsconfig.json in project root
 */
gulp.task('compile:test', ['cleanup:dest'], function() {
    var tsres = gulp.src('./test/**/*.ts')
        .pipe(ts({
            declaration: true,
            module: 'commonjs'
        }));
    return tsres.js.pipe(gulp.dest(config.dest+'/test'));
});

/**
 * compiles tests and typescript
 */
gulp.task('compile:all', ['compile:test', 'compile:lib']);

/**
 * monitor the code and rebuild
 * 
 */
gulp.task('watch:lib', ['compile:lib'], function () {
    return gulp.watch(["**/*.ts", "tsconfig.json"], ['compile:lib']);
});

/**
 * run unit tests
 * 
 * runs the unit tests as a gulp task. since our tests depend on app code,
 * we compile:all as a dependency of this build task.
 */
gulp.task('test:unit', ['compile:all'], function () {
   return gulp.src(config.dest+'/test/**/*.js', {read: false})
    .pipe(mocha({
        timeout: 5000
    })); 
});

/**
 * run all tests
 */
gulp.task('test:all', ['test:unit']);

/**
 * cleanup dest
 * 
 * cleans up the directory listed in config.dest by force deleting it
 */
gulp.task('cleanup:dest', function () {
    return del.sync([config.dest], {force: true});
});

/**
 * define our default task (run with `gulp`)
 * 
 * this will compile, watch, and run the code
 */
gulp.task('default', ['watch:lib']);