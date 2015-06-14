#!/usr/bin/env node

/// <reference path="typings/node/node.d.ts"/>

var path = require('path');
var fs = require('fs');

var rp = require('request-promise');
var Promise = require('promise');

var argv = process.argv;
var e = false;
var modules = [];

for (var i = 0 ; i < argv.length ; i++) {
	if (argv[i].toLowerCase() === "--errors" || argv[i].toLowerCase() === "-e") {
		e = true;
		break;
	}
	if (argv[i].toLowerCase() === "--module" || argv[i].toLowerCase() === "-m") {
		for (var j = i+1 ; j < argv.length ; j++) {
			if (argv[j].indexOf("-") === 0) break;
			modules.push(argv[j]);
		}
	}
}

var pkg = require(path.normalize(process.cwd() + "/" + "package.json"));
var dir = path.normalize(process.cwd() + "/" + "typings");


var deps = ["node"];
if (modules.length == 0) { 
	for (var prop in pkg["dependencies"]) {
		deps.push(prop);
	}
	for (var prop in pkg["devDependencies"]) {
		deps.push(prop);
	}
} else {
	for (var i = 0 ; i < modules.length ; i++) {
		deps.push(modules[i]);
	}
}

function proc(pth, body) {
	pth = path.normalize(dir + "/" + pth);
	try{
		fs.mkdirSync(dir);
	}catch(e){}
	try{
		var pthdir = path.dirname(pth);
		fs.mkdirSync(pthdir);
	}catch(e){}
	fs.writeFileSync(pth, body);
	if (!e) {
		console.log("200 | " + pth);
	}
}

function bproc(path, res) {
	console.error(res.statusCode + " | " + path);
}

for (var i = 0 ; i < deps.length ; i++) {
	var prom = rp("https://github.com/borisyankov/DefinitelyTyped/raw/master/"+deps[i]+"/"+deps[i]+".d.ts");
	prom.then(proc.bind(this, deps[i]+"/"+deps[i]+".d.ts"), bproc.bind(this, deps[i]+"/"+deps[i]+".d.ts"));
}
