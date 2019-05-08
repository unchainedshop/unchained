const setupInMemoryMongoDB = require('@shelf/jest-mongodb/setup')
const { spawn } = require('child_process');

let meteorProcess = null;

const startAndWaitForMeteor = async (config) => {
  return new Promise(function(resolve, reject) {
    try {
      if (meteorProcess) {
        global.__SUBPROCESS_METEOR__ = meteorProcess;
        global.__SUBPROCESS_METEOR__.ref()
        return resolve();
      }
      global.__SUBPROCESS_METEOR__ = spawn(
        'meteor',
        [
          '--no-release-check',
          `--no-lint`
        ], {
          detached: true,
          cwd: process.cwd() + '/examples/minimal',
        }
      );
      meteorProcess = global.__SUBPROCESS_METEOR__;
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

module.exports = async (config) => {
  await setupInMemoryMongoDB(config);
  await startAndWaitForMeteor(config)
};
