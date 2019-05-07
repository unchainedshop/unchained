const setupInMemoryMongoDB = require('@shelf/jest-mongodb/setup')
const { spawn } = require('child_process');

const startAndWaitForMeteor = async () => {
  return new Promise(function(resolve, reject) {
    try {
      global.__SUBPROCESS_METEOR__ = spawn(
        'meteor',
        [
          '--no-release-check',
          `--no-lint`
        ], {
          detached: false,
          cwd: process.cwd() + '/examples/minimal',
        }
      );
      global.__SUBPROCESS_METEOR__.stdout.on('data', (data) => {
        const dataAsString = '' + data;
        if (process.env.DEBUG) {
          console.log(dataAsString)
        }
        if (dataAsString.indexOf("Can't listen") !== -1) {
          reject(dataAsString);
        }
        if (dataAsString.indexOf("App running at: ") !== -1) {
          resolve(dataAsString.substring(19))
        }
      });
    } catch (e) {
      reject(e.message);
    }
  })
}

module.exports = async (...config) => {
  await setupInMemoryMongoDB(...config);
  global.__SUBPROCESS_METEOR_ROOT_URL__ = await startAndWaitForMeteor(...config)
};
