const { getPwm } = require('./i2c-led');

const { run } = require('./eventdump');

const testPca9685 = async () => {
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
	} catch (err) {
		console.error('Error initializing PCA9685', err);
	}
};

// testPca9685();
run();
