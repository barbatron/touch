// const { testI2c } = require('./i2c-led');
const { testMidi } = require('./midisend');
const { createDefaultTouch } = require('./touch');
const { EventEmitter } = require('events');
const rtpmidi = require('rtpmidi');

const REMOTE_IP = '192.168.1.201';
const LOCAL_IP = '127.0.0.1';

const onClose = [];

// PWM using PCA9685:
// testI2c();

// Virtual MIDI

// rtpmidi.manager.startDiscovery();

const { session, input, output } = testMidi();
const MIDI_MIN = 0;
const MIDI_MAX = 127;

const lerpMidiValue = (value) => Math.floor(Math.max(MIDI_MIN, Math.min(value, MIDI_MAX)));

let midiState = {
	a: 64,
	b: 64,
	last: undefined,
	index: -1
};

let reconnectSession = false;
let isConnected = false;

const connectSession = () => {
	session.connect({ address: REMOTE_IP, port: 5004 });
};

session.on('connect', () => {
	console.log('rtp> Session connect');
	isConnected = true;
});

session.on('disconnect', () => {
	console.log('rtp> Session disconnect');
	isConnected = false;
	if (reconnectSession) {
		console.log('rtp> Issuing reconnect...');
		connectSession();
	}
});

connectSession();
onClose.push(
	() =>
		new Promise((resolve) => {
			try {
				rtpmidi.manager.reset(resolve);
			} catch (err) {
				console.log('session crashed expectedly - enjoy having sudo processes hogging the ports!', err);
			}
		})
);

/**
 * 
 * @param {number} channel (0-15) 
 * @param {number} bendValue (-1 to 1)
 */
const toPitchBend = (channel, bendValue) => {
	const command = 0xe0 | ((channel & 0x0f) >> 1);
	const bendInteger = Math.floor(8192.0 + bendValue * 8192.0);
	console.log('bendinteger', bendInteger);
	const lowValue = bendInteger & 0x7f;
	const highValue = (bendInteger & 0xff) >> 7;
	return [ command, lowValue, highValue ];
};

const updateMidiState = (touchState) => {
	const a = (Math.abs(touchState.x) - 200.0) / 210.0 - 0.5;
	if (a > 1) a = 1;
	if (a < -1) a = -1;
	const b = lerpMidiValue(touchState.y / 260);
	midiState = {
		...midiState,
		last: { a: midiState.a, b: midiState.b },
		a,
		b,
		index: midiState.index + 1
	};
	console.log('Midi state = ', midiState);

	const pitchBendMessage = toPitchBend(1, a);
	console.log(pitchBendMessage);
	output.sendMessage(pitchBendMessage); // X-axis: pitch bend
};

onClose.push(() => {
	reconnectSession = false;
	if (isConnected) session.disconnect();
});

// Dump touch panel packets:
let touchState = undefined;

const updateTouchState = (newState) => {
	const timestamp = new Date().toUTCString();
	const index = touchState ? touchState.index + 1 : 0;
	touchState = { ...newState, index, timestamp };
	console.log('TouchState = ', touchState);
	return touchState;
};

const handleTouchEvent = (ev) => {
	console.log('------------------------');
	// parse event
	const { xDelta, yDelta } = ev;
	// update touch state
	const prevState = {
		x: 0,
		y: 0,
		index: 0,
		lastX: undefined,
		lastY: undefined,
		...touchState
	};
	const x = prevState.x + xDelta;
	const y = prevState.y + yDelta;
	const lastX = prevState.x;
	const lastY = prevState.y;
	updateTouchState({ x, y, lastX, lastY, ev });
	updateMidiState(touchState);
};

const { touch, device } = createDefaultTouch();
touch.on(device, handleTouchEvent);
onClose.push(
	() =>
		new Promise((res) => {
			touch.close();
			res();
		})
);

process.on('SIGINT', () => {
	console.log('SIGINT> shutting down...');

	const closePromises = onClose.map((op) => {
		try {
			return (op() || Promise.resolve()).catch((err) => {
				console.warn('SIGINT> Failed teardown:', err);
			});
		} catch (err) {
			console.warn('SIGINT> Disposer threw: ', err);
		}
		return Promise.resolve();
	});

	console.log('SIGINT> Waiting for cleanup...');

	Promise.all(closePromises).then(() => {
		console.log('SIGINT> Killing process');
		process.exit();
	});
});
