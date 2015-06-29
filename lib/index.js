/// <reference path="../typings/commander/commander.d.ts" />
/// <reference path="../typings/node/node.d.ts" />

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