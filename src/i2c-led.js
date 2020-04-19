const i2cBus = require('i2c-bus');
const Pca9685Driver = require('pca9685').Pca9685Driver;

const DEFAULT_OPTIONS = {
	address: 0x41,
	frequency: 1024,
	debug: true
};

const getPwm = (bus, address, frequency) => {
	const options = {
		i2c: i2cBus.openSync(bus),
		address,
		frequency,
		debug: true
	};

	return new Promise((resolve, reject) => {
		let pwm;

		const handleInit = (err) => {
			if (err) {
				reject(err);
			}
			resolve(pwm);
		};

		pwm = new Pca9685Driver(options, handleInit);
	});
};

const testI2c = async () => {
	const pcaAddr = 0x41;
	const pwmChan = 15;

	try {
		const pwm = await getPwm(1, pcaAddr, 1024);
		console.log('Initialization done');
		console.log('Things in pwm ', Object.keys(pwm));

		pwm.channelOn(pwmChan);

		setInterval(() => {
			pwm.setDutyCycle(pwmChan, Math.random());
		}, 100);

		return pwm;
	} catch (err) {
		console.error('Error initializing PCA9685', err);
	}
};

module.exports = {
	testI2c
};
