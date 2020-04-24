// const { testI2c } = require('./i2c-led');
const { testMidi } = require('./midisend');
const { createDefaultTouch } = require('./touch');

const onClose = [];

// PWM using PCA9685:
// testI2c();

// Virtual MIDI
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

const updateMidiState = (touchState) => {
	const a = lerpMidiValue(touchState.x / 510 * 127);
	const b = lerpMidiValue(touchState.y / 262 * 127);
	midiState = {
		...midiState,
		last: { a: midiState.a, b: midiState.b },
		a,
		b
	};
	console.log('Midi state = ', midiState);

	// Toss a message!
	const volume = a;
	const note = b;
	output.sendMessage([ 176, 7, 100 ]); // X-axis: volume [ 176, 7, 100 ]
	output.sendMessage([ 144, 64, 90 ]); // Y-axis: note on [ 144, 64, 94 ]
	// Note off
	setTimeout(() => output.sendMessage([ 128, 64, 40 ]), 500); // note off [ 128, 64, 40 ]
};

onClose.push(() => {
	input.closePort();
	output.closePort();
	session.end();
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
		...touchState,
		x: 260,
		y: 141,
		lastX: undefined,
		lastY: undefined
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

process.on('SIGINT', () => {
	console.log('Shutting down...');
	onClose.forEach((op) => {
		try {
			op();
		} catch (err) {
			console.warn('Failed teardown: ', err);
		}
	});
});
