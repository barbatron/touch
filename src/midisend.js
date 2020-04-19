const midi = require('midi');
const rtpmidi = require('rtpmidi');

const REMOTE_IP = '192.168.1.201';
const LOCAL_IP = '127.0.0.1';

const testMidi = (ip = REMOTE_IP) => {
	const input = new midi.input();
	const output = new midi.output();

	const session = rtpmidi.manager.createSession({
		localName: 'Session',
		bonjourName: 'Session',
		port: 5008
	});

	// Create the virtual midi ports
	input.openVirtualPort('Bubu');
	output.openPort(1);

	// Route the messages
	session.on('message', (deltaTime, message) => {
		// message is a Buffer so we convert it to an array to pass it to the midi output.
		const commands = Array.prototype.slice.call(message, 0);
		console.log('received a network message', commands);
		output.sendMessage(commands);
	});

	// session.on('ready', () => {
	// 	// Send a note
	// 	setInterval(() => {
	// 		try {
	// 			session.sendMessage([ 0x80, 0x40 ]);
	// 			session.sendMessage([ 0x90, 0x40, 0x7f ]);
	// 		} catch (err) {
	// 			console.warn('Warn (note player): ', err);
	// 		}
	// 	}, 1000);
	// });

	//input.on('message', (deltaTime, message) => {
	//console.log('received a local message', message);
	//session.sendMessage(deltaTime, message);
	//});

	// Connect to a remote session
	session.connect({ address: ip, port: 5004 });

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
