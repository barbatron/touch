// const i2cBus = require('i2c-bus');
// const { Pca9685Driver } = require('pca9685');

// const DEFAULT_OPTIONS = {
// 	address: 0x41,
// 	frequency: 1024,
// 	debug: true
// };

// const openPca = async (i2cBus, address, frequency, debug = false) => new Promise((res, rej) => {
//   const options = {
// 		i2c: i2cBus,
// 		address,
// 		frequency,
// 		debug: true
// 	};

//   let pca;

//   const handleInit = (err) => {
//     if (err) {
//       reject(err);
//     }
//     resolve(pca);
//   };

//   pca = new Pca9685Driver(options, handleInit);
// });

// const testI2c = async () => {
// 	const pcaAddr = 0x41;
// 	const pwmChan = 15;

// 	try {
// 		const pwm = await getPwm(1, pcaAddr, 1024);
// 		console.log('Initialization done');
// 		console.log('Things in pwm ', Object.keys(pwm));

// 		pwm.channelOn(pwmChan);

// 		setInterval(() => {
// 			pwm.setDutyCycle(pwmChan, Math.random());
// 		}, 100);

// 		return pwm;
// 	} catch (err) {
// 		console.error('Error initializing PCA9685', err);
// 	}
// };

// module.exports = {
// 	testI2c,
// 	openPca
// };
