const midi = require('midi');
const rtpmidi = require('rtpmidi');

const REMOTE_IP = '192.168.1.201';
const LOCAL_IP = '127.0.0.1';

const testMidi = (ip = REMOTE_IP) => {
	const input = new midi.input();
	const output = new midi.output();

	const session = rtpmidi.manager.createSession({
		localName: 'BARBASTATION',
		bonjourName: 'BARBASTATION',
		port: 5006
	});

	// Create the virtual midi ports
	input.openVirtualPort('My Virtual Midi Input');
	output.openPort(1);

	// Route the messages
	session.on('message', (deltaTime, message) => {
		// message is a Buffer so we convert it to an array to pass it to the midi output.
		const commands = Array.prototype.slice.call(message, 0);
		console.log('received a network message', commands);
		output.sendMessage(commands);
	});

	input.on('message', (deltaTime, message) => {
		console.log('received a local message', message);
		session.sendMessage(deltaTime, message);
	});

	return {
		session,
		input,
		output
	};
};

module.exports = {
	testMidi,
	REMOTE_IP,
	LOCAL_IP
};
