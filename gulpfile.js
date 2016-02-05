var gulp = require('gulp');
var ts = require('gulp-typescript');
var del = require('del');
var fs = require('fs');
var mocha = require('gulp-mocha');
var merge2 = require('merge2');

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
    
    var tsproj = ts.createProject(tsconfig);
    var tsres = tsproj.src().pipe(ts(tsproj));
    return merge2([
        tsres.js.pipe(gulp.dest(config.dest+'/test', {overwrite: true})),
        tsres.dts.pipe(gulp.dest(config.dest+'/def', {overwrite: true}))
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
    .pipe(mocha()); 
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