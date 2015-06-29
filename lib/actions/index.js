var actions = [
	require('./grab'),
	require('./inject')
];

function mountAll (program) {
	for (var i = 0 ; i < actions.length ; i++) {
		var a = actions[i];
		program.command(a.command).description(a.description).action(a.action.bind(program));
	}
}

module.exports = {
	mountAll: mountAll
};