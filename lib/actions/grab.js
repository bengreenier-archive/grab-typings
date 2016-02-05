/// <reference path="../../typings/request-promise/request-promise.d.ts" />
/// <reference path="../../typings/node/node.d.ts" />

var path = require('path');
var assert = require('assert');
var fs = require('fs');

var rp = require('request-promise');

// the commander action we export
// note that `this` is the commander instance
function action (mods) {
	processCommand(mods, this.outdir, this.success, this.error, console.log.bind(console));
}

function processCommand(moduleNames, outDirectory, successFlag, errorFlag, logFunc) {
	logFunc = logFunc || function(){};
	successFlag = successFlag || true;
	errorFlag = errorFlag || true;
	
	if (typeof(moduleNames) === "string") {
		moduleNames = [moduleNames];
	}
	if (moduleNames.length == 0) {
		moduleNames = parsePackage();
	}
	
	try{
		fs.mkdirSync(outDirectory);
	} catch (e) {}
	
	var proms = [];
	moduleNames.forEach(function (module) {
		proms.push(getTyping(outDirectory, module, successFlag, errorFlag, logFunc));
	});
	return proms;
}

// get a specific typing
function getTyping (outDir, pkgName, successFlag, errorFlag, logFunc) {
	assert(fs.existsSync(outDir), outDir+" should exist");
	
	var outPath = path.normalize(outDir + "/" + pkgName + "/");
	
	return rp("https://github.com/borisyankov/DefinitelyTyped/raw/master/"+pkgName+"/"+pkgName+".d.ts")
		.then(function (body) {
			// swallow the error, if outPath can't be made (might already be there)
			try {
				fs.mkdirSync(outPath);
			} catch (e) {}
			
			// TODO: only get if version is different
			fs.writeFileSync(outPath+pkgName+".d.ts", body);
			
			if (successFlag) {
				logFunc("200 | " + pkgName);
			}
		}, function (res) {
			if (errorFlag) {
				logFunc(res.statusCode + " | " + pkgName);
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
	action: action,
	raw: processCommand
};