// import "./rtpmidi";
const i2cBus = require('i2c-bus');
const { Pca9685Driver } = require('pca9685');

const I2C_BUS = 1;
const PCA_ADDRESS = 0x41;
const TOP_FAN_CHANNEL = 15; // right-most
const FILTER_FAN_CHANNEL = 11; // right-most in adjacent block of 4

const openPca = async (i2cBus, address, frequency, debug = false) =>
	new Promise((res, rej) => {
		const options = {
			i2c: i2cBus,
			address,
			frequency,
			debug: true
		};
		const pcaInit = () => {
			console.log('PCA initialized');
		};
		const pca = new Pca9685Driver(options, pcaInit);
		res(pca);
	});

class Fan {
	constructor(pca, channel, name) {
		this.name = name;
		this.pca = pca;
		this.channel = channel;
	}
	open(setToZero = true) {
		this.pca.channelOn(this.channel);
		if (setToZero) {
			this.set(0);
		}
	}
	close() {
		this.pca.channelOff(this.channel);
	}
	set(value) {
		this.pca.setDutyCycle(this.channel, value);
	}
	toString() {
		return `Fan "${this.name}" on channel ${this.channel}`;
	}
}

const startFanControl = async () => {
	console.log('Fans> Opening bus');
	const i2cbus = await i2cBus.openPromisified(I2C_BUS);
	console.log('Fans> Opening PCA');
	const pca = await openPca(i2cbus, PCA_ADDRESS);

	console.log('Fans> Creating fans');
	const topFan = new Fan(pca, TOP_FAN_CHANNEL, 'Top');
	const filterFan = new Fan(pca, FILTER_FAN_CHANNEL, 'Filter');

	console.log('Fans> Returning fans', topFan, filterFan);
	return {
		topFan,
		filterFan
	};
};

module.exports = {
	startFanControl
};
