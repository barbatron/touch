const rtpmidi = require('rtpmidi');
const { Mouse } = require('./mouse');

const REMOTE_IP = '192.168.1.201';

const w = (...args) => console.log(args);

let mode = 'main';

let sessionConfiguration = null;

const sessionConfigurationDefaults = { name: 'Session', bonjourName: 'Session', port: 5008 };

const sessionProperties = [ 'name', 'bonjourName', 'port' ];

let sessionProperty;

let session = null;

const stdin = process.openStdin();

// stdin.setRawMode(true);

stdin.resume();
stdin.setEncoding('utf8');

session.connect({ address: REMOTE_IP, port: 5004 });

//rtpmidi.manager.startDiscovery();

main();

const toPitchBend = (channel, bendValue) => {
	const command = 0xe0 | (channel & 0x0f);
	const bendInteger = Math.floor(8192 + bendValue * 8191);
	const lowValue = bendInteger & 0x7f;
	const highValue = bendInteger >> 7;
	return [ command, lowValue, highValue ];
};

const mouse = new Mouse();
let mx = 0;
mouse.on(mouse.device, (ev) => {
	mx += ev.xDelta;
	console.log('mx', mx);
});

// on any data into stdin
stdin.on('data', (key) => {
	if (key == 'q') {
		mouse.close();
		rtpmidi.manager.reset(() => {
			process.exit();
		});
	}

	switch (mode) {
		case 'main':
			switch (key) {
				case 'c':
					if (!session) {
						return w('Select a local session first');
					}
					session.connect({ address: '127.0.0.1', port: 5004 });
					break;
				case 's':
					mode = 'newSession';
					sessionConfiguration = {};
					sessionProperty = 0;
					newSession(null);
					break;
				case 'h':
					main();
					break;
				case 'n':
					if (!session) {
						main();
						return w('Select a local session first');
					}
					w('Sending a Message...');
					session.sendMessage([ 144, 60, 127 ]);
					break;
				case 'd':
					rtpmidi.log.level = !rtpmidi.log.level;
					w(`Debug mode is ${session.debug ? 'on' : 'off'}.`);
					main();
					break;
				case 'l':
					listSessions();
					break;
				case 'r':
					listRemoteSessions();
					break;
			}
			break;
		case 'remote':
			var integer = parseInt(key, 10);
			var sessionInfo = rtpmidi.manager.getRemoteSessions()[integer];
			if (sessionInfo) {
				w('Connecting...');
				session.connect(sessionInfo);
			}
			main();
			break;
		case 'sessions':
			var integer = parseInt(key, 10);
			session = rtpmidi.manager.getSessions()[integer];
			if (session) {
				w(`Selected session ${integer}`);
			}
			main();
			break;
		case 'newSession':
			newSession(key);
			break;
	}
});

function main() {
	mode = 'main';
	w('Commands: ');
	w('h: Print this help message');
	w('s: Create a new local session');
	w('c: connect to 127.0.0.1:5004');
	w('d: Toggle debug mode.');
	w('n: send a test note to all streams');
	w('l: List the local sessions.');
	w('r: List the available remote sessions.');
}

function listRemoteSessions() {
	w('Remote sessions: \n');
	w(
		rtpmidi.manager
			.getRemoteSessions()
			.map(
				(session, index) =>
					`${index}: ${session.name} (Hostname: ${session.host} Address: ${session.address} Port: ${session.port})`
			)
			.join('\n')
	);

	if (!session) {
		main();
		return w('To connect to a remote session select a local session first ');
	}
	mode = 'remote';
	w('Press the index number to connect to a session or any other key to go back to main menu.');
}

function listSessions() {
	mode = 'sessions';
	w('Local sessions: \n');
	w(
		rtpmidi.manager
			.getSessions()
			.map(
				(session, index) =>
					`${index}: ${session.name} (Bonjour name: ${session.bonjourName} Address: ${session.address} Port: ${session.port})`
			)
			.join('\n')
	);
	w('Press the index number to select a session or any other key to go back to main menu.');
}

function createSession(conf) {
	session = rtpmidi.manager.createSession(conf);

	session.on('streamAdded', (event) => {
		const { stream } = event;
		w(`New stream started. SSRC: ${stream.ssrc}`);
		stream.on('message', (deltaTime, message) => {
			w('Received a command: ', message);
		});
	});

	session.on('streamRemoved', (event) => {
		w(`Stream removed ${event.stream.name}`);
	});

	session.start();
	main();
}

function newSession(key) {
	switch (key) {
		case '\u001b':
			main();
			break;
		case '\u000d':
			if (sessionConfiguration[sessionProperties[sessionProperty]] === '') {
				sessionConfiguration[sessionProperties[sessionProperty]] =
					sessionConfigurationDefaults[sessionProperties[sessionProperty]];
			}
			process.stdout.write('\n');
			sessionProperty++;
			if (sessionProperty === sessionProperties.length) {
				sessionConfiguration.port = parseInt(sessionConfiguration.port, 10);
				createSession(sessionConfiguration);
				w('Session started');
				sessionConfiguration = null;
				sessionProperty = 0;
			} else {
				newSession(null);
			}
			break;
		case '\u007f':
			if (
				sessionConfiguration[sessionProperties[sessionProperty]] &&
				sessionConfiguration[sessionProperties[sessionProperty]].length
			) {
				sessionConfiguration[sessionProperties[sessionProperty]] = sessionConfiguration[
					sessionProperties[sessionProperty]
				].slice(0, -1);
				process.stdout.write(`\r${sessionConfiguration[sessionProperties[sessionProperty]]}`);
			}
			break;
		case null:
			w(
				`Type in the ${sessionProperties[
					sessionProperty
				]} of the new session and press Enter. Default: ${sessionConfigurationDefaults[
					sessionProperties[sessionProperty]
				]}`
			);
			sessionConfiguration[sessionProperties[sessionProperty]] = '';
			break;
		default:
			sessionConfiguration[sessionProperties[sessionProperty]] += key;
			process.stdout.write(key);
			break;
	}
}

module.exports = session;
