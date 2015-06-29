var path = require('path');
var assert = require('assert');
var fs = require('fs');

var rp = require('request-promise');

// the commander action we export
// note that `this` is the commander instance
function action (mods) {
	if (mods.length == 0) {
		mods = parsePackage();
	}
	
	// swallow the error, trying to make outDir (might already be there)
	try{
		fs.mkdirSync(this.outdir);
	} catch (e) {}
	
	for (var i = 0 ; i < mods.length ; i++) {
		getTyping.call(this, this.outdir, mods[i]);
	}
}

// get a specific typing
function getTyping (outDir, pkgName) {
	assert(fs.existsSync(outDir), outDir+" should exist");
	
	var self = this;
	var outPath = path.normalize(outDir + "/" + pkgName + "/");
	
	return rp("https://github.com/borisyankov/DefinitelyTyped/raw/master/"+pkgName+"/"+pkgName+".d.ts")
		.then(function (body) {
			// swallow the error, if outPath can't be made (might already be there)
			try {
				fs.mkdirSync(outPath);
			} catch (e) {}
			
			// TODO: only get if version is different
			fs.writeFileSync(outPath+pkgName+".d.ts", body);
			
			if (self.success) {
				console.log("200 | " + pkgName);
			}
		}, function (res) {
			if (self.error) {
				console.log(res.statusCode + " | " + pkgName);
			}
		});
}

// parse the package.json and return deps/devDeps as one array
function parsePackage() {
	var pkg = require(path.normalize(process.cwd() + "/" + "package.json"));
	var deps = ["node"];
	for (var prop in pkg["dependencies"]) {
		deps.push(prop);
	}
	for (var prop in pkg["devDependencies"]) {
		deps.push(prop);
	}
	return deps;
}

module.exports = {
	command: "grab [modules...]",
	description: "grab definitions for module(s)",
	action: action
};