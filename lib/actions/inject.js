/// <reference path="../../typings/glob/glob.d.ts" />
/// <reference path="../../typings/node/node.d.ts" />

var fs = require('fs');
var path = require('path');

require('string.prototype.endswith');
var Promise = require('promise');
var glob = require('glob');
var detective = require('detective');
var coreModules = require('node-core-module-names');

function action (globMatcher) {
	var self = this;
	var outdir = this.outdir;
	
	globit(globMatcher)
		.done(function (files) {
			files.forEach(function (v) {
				readAndDetect(v)
					.then(checkReferences)
					.then(checkTypesExistence(outdir))
					.then(addReferences(outdir))
					.done(function (fileObj) {
						fileObj.reqs.forEach(function (v) {
							if (v.shouldInject && self.success) {
								console.log(fileObj.name + " | " + v.name);
							}
							else if (!v.shouldInject && self.error) {
								console.log("404 | " + fileObj.name + " | " + v.name);
							}
						});
					});
			});
		});
}

function globit (matcher) {
	return new Promise(function (resolve, reject) {
		glob(matcher, function (err, files) {
			if (err) return reject(err);
			return resolve(files);
		});
	});
}

function readAndDetect (file) {
	return new Promise(function (resolve, reject) {
		var src = fs.readFileSync(file).toString();
		var modules = detective(src);
		
		// TODO: make this optional
		var useNode = false;
		var finalModules = [];
		for (var j = 0 ; j < modules.length ; j++) {
			var pushed = false;
			for (var k = 0 ; k < coreModules.length ; k++) {
				if (coreModules[k] == modules[j]) {
					useNode = true;
					pushed = true; // useNode is like pushing since we're flagging it as 'used'
					break;
				}
			}
			if (!pushed) {
				pushed = true;
				finalModules.push(modules[j]);
			}
		}
		modules = finalModules;
		
		if (useNode) {
			modules.unshift("node");
		}
		// TODO: end optional
		
		// we transform "filename" to {name:"filename", src: "...", reqs:["node",...]}
		resolve({
			name: file,
			src: src,
			reqs: modules
		});
	});
}

function checkReferences (fileObj) {
	
	// scan src for reference tags
	var re = /\/\/\/\s+<reference path="(.*?)" \/>\s+/g,
		match,
		tags = [];
	while (match = re.exec(fileObj.src)) {
		tags.push(match[1]);
	}
	
	for (var i = 0 ; i < fileObj.reqs.length ; i++) {
		// we transform reqs: ["node",...] to reqs: [{name: "node", shouldInject:<bool>},...]
		fileObj.reqs[i] = {
			name: fileObj.reqs[i],
			shouldInject: true
		};
		
		for (var j = 0 ; j < tags.length ; j++) {
			if (tags[j].endsWith(fileObj.reqs[i].name + ".d.ts")) {
				fileObj.reqs[i].shouldInject = false; // we've already got it, don't re-inject
			}
		}
	}
	return fileObj;
}

function checkTypesExistence (outdir) {
	return function (fileObj) {
		for (var j = 0 ; j < fileObj.reqs.length ; j++) {
			
			// if we still think we should inject, we look for the typings file on disk
			if (fileObj.reqs[j].shouldInject) {
				fileObj.reqs[j].shouldInject = fs.existsSync(path.normalize(outdir + "/" + fileObj.reqs[j].name));
			}
		}
		return fileObj;
	};
}

function addReferences (outdir) {
	var absOut = path.normalize(outdir);
	
	return function (fileObj) {
		var absPath = path.resolve(process.cwd(), fileObj.name);
		
		// get 'distance' from absPath to absOut
		var typingPath = "";
		for (var i = 0 ; i < distanceCount(absOut, absPath) ; i++) {
			typingPath += "../";
		}
		typingPath += path.basename(absOut);
			
		for (var i = 0 ; i < fileObj.reqs.length ; i++) {
			var req = fileObj.reqs[i];
			if (!req.shouldInject) continue;

			var reqPath = path.normalize( typingPath + "/" + req.name + "/" + req.name + ".d.ts");
			reqPath = reqPath.replace(/\\/g, "/");
			
			var referenceLine = '/// <reference path="'+reqPath+'" />' + getLineEnding();
			
			fileObj.src = referenceLine + fileObj.src;
		}
		
		fs.writeFileSync(absPath, fileObj.src);
		
		return fileObj;
	};
}

// this might be some hacky shit, but it seems to work so..
// TODO find a better way?
function distanceCount (from, to) {
	from = from.split(path.sep);
	to = to.split(path.sep);
	
	var maxLength = (from.length > to.length) ? from.length : to.length,
		j = -1;
	for (var i = 0 ; i < maxLength ; i++) {
		if (from[i] != to[i]) {
			j++;
		}
	}
	return j;
}

function getLineEnding () {
	var plat = process.platform;
	if (plat == "win32") return "\r\n";
	else return "\n";
}

module.exports = {
	command: "inject <glob>",
	description: "inject reference paths into files that match <glob>",
	action: action
};