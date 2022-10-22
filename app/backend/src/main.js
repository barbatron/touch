// const bös = require "./rtpmidi";
const { startFanControl } = require('./fans');
const WebSocket = require('ws');
const process = require('process');

// Misc

const log = (...args) => console.log.apply(console, [ `${new Date().toISOString()}> `, ...args ]);
const onClose = [];

// === Websocket stuff ===

const LISTEN_PORT = 8877;
const wsServer = new WebSocket.Server({ port: LISTEN_PORT });

// Protocol

const messageHandlers = {};

// Heartbeat

function noop() {}

function heartbeat() {
	this.isAlive = true;
}

const handleMessage = (webSocket, message) => {
	console.log('message from websocket', message, Object.keys(messageHandlers));

	const { type, params } = JSON.parse(message);
	console.log('type params', type, params);

	const messageHandler = messageHandlers[type];
	if (messageHandler) {
		console.log('messageHandler', messageHandler);
		try {
			const result = messageHandler(params);
			console.log('message result', result);
		} catch (err) {
			console.warn('error handling message', message, type, params, err);
		}
	} else {
		console.log('No handler found');
	}
};

wsServer.on('connection', function connection(webSocket, req) {
	// log
	const ip = req.socket.remoteAddress;
	console.log('WS> connection from %s', ip);

	// establish heartbeat
	webSocket.isAlive = true;
	webSocket.on('pong', heartbeat);

	// connect messages
	webSocket.on('message', (data) => handleMessage(webSocket, data));

	// sign-off
	webSocket.on('close', () => {
		console.log('WS> closed connection', webSocket.toString());
	});
});

const interval = setInterval(() => {
	console.log('%s> ping', new Date().toISOString());
	wsServer.clients.forEach((ws) => {
		if (ws.isAlive === false) {
			return ws.terminate();
		}
		ws.isAlive = false;
		ws.ping(noop);
	});
}, 30000);

wsServer.on('close', () => clearInterval(interval));

console.log('WS setup OK');

// === FANS ===

console.log('Fans...');

const makeFanMessageHandler = (fan, name) => (params) => {
	try {
		const val = Number(params);
		console.log('Fan value', val);
		if (val >= 0 && val <= 1) {
			console.log('Setting fan %s to %d%', name, Math.floor(val * 100));
			fan.set(val);
		} else {
			console.warn('Fan value out of range (0-1)');
		}
	} catch (err) {
		console.warn('Unable to parse fan params', err);
	}
};

startFanControl().then(({ topFan, filterFan }) => {
	console.log('Got the fans boss!');

	topFan.open();
	messageHandlers.TOP_FAN = makeFanMessageHandler(topFan);

	filterFan.open();
	messageHandlers.FILTER_FAN = makeFanMessageHandler(filterFan);

	onClose.push(
		// Disconnect PCA
		() => topFan.pca.close()
	);
});

// == DISPOSAL ===

const close = () => {
	onClose.map((thing) => thing());
};

// === DONE ===
onClose.push(
	// Shut down web server and close clients/ports
	() => wsServer.close()
);

console.log(`Listening on port ${LISTEN_PORT}...`);
