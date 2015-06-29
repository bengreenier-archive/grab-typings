var path = require('path');

var program = require('commander');

var actions = require('./actions');

module.exports = function () {
	// describe the program
	program
		.alias("gt")
		.version(require('../package.json').version)
		.description('Grab definitelyTyped typings for package.json dependencies. By Ben Greenier');
		
	program.option('-E, --no-success', 'Show errors only');
	program.option('-S, --no-error', 'Show successes only');
	program.option('-O, --outdir', 'Set the output directory. defaults to ./typings');
	
	// mount cli actions
	actions.mountAll(program);

	program.outdir = path.normalize(process.cwd() + '/typings');	
	program.parse(process.argv);
};

function isCoreNode (mod) {
	return mod.indexOf("package.json") > -1 || coreModules.indexOf(mod) > -1;
}

function generateReference (mod) {
	// todo, do this better
	return '/// <reference path="typings/'+mod+'/'+mod+'.d.ts"/>';
}

function getLineEnding () {
	var plat = process.platform;
	if (plat == "win32") return "\r\n";
	else return "\n";
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

// grab some modules
function grab(dir, mods, showErrors, showSuccess) {
	var opts = {
		showErrors: showErrors,
		showSuccess: showSuccess
	};
	
	for (var i = 0 ; i < mods.length ; i++) {
		var prom = rp("https://github.com/borisyankov/DefinitelyTyped/raw/master/"+mods[i]+"/"+mods[i]+".d.ts");
		prom.then(proc.bind(this, opts, dir, mods[i]+"/"+mods[i]+".d.ts"), bproc.bind(this, opts, mods[i]+"/"+mods[i]+".d.ts"));
	}
}

// processes successful reqs
function proc(opts, dir, pth, body) {
	var writePath = path.normalize(dir + "/" + pth);
	var catchFlag = false;
	// we swallow dir creation error
	try{
		fs.mkdirSync(dir);
	} catch (e) {}
	
	try{
		var pthdir = path.dirname(writePath);
		fs.mkdirSync(pthdir);
		fs.writeFileSync(writePath, body);
	} catch(e) {
		// the split takes the first part of an fs failure message (like EEXIST, etc)
		if (opts.showErrors) {
			console.log(e.message.split(",")[0] + " | "+ pth);
		}
		catchFlag = true;
	}
	
	if (!catchFlag && opts.showSuccess) console.log("200 | " + pth);
}

// short for bad proc. processes failed reqs
function bproc(opts, path, res) {
	if (opts.showErrors) {
		console.error(((res.statusCode) ? res.statusCode : res.message.split(" ")[2]) + " | " + path);
	}
}
