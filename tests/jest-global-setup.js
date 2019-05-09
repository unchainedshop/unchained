const setupInMemoryMongoDB = require('@shelf/jest-mongodb/setup');
const { spawn } = require('child_process');
const { wipeDatabase } = require('./helpers');

let meteorProcess = null;
let mongoDBRunning = false;

const startAndWaitForMeteor = async () => {
  return new Promise((resolve, reject) => {
    try {
      if (meteorProcess) {
        global.__SUBPROCESS_METEOR__ = meteorProcess;
        global.__SUBPROCESS_METEOR__.ref();
        resolve();
        return;
      }
      global.__SUBPROCESS_METEOR__ = spawn(
        'meteor',
        ['--no-release-check', `--no-lint`],
        {
          detached: true,
          cwd: `${process.cwd()}/examples/minimal`
        }
      );
      meteorProcess = global.__SUBPROCESS_METEOR__;
      global.__SUBPROCESS_METEOR__.stdout.on('data', data => {
        const dataAsString = `${data}`;
        if (process.env.DEBUG) {
          console.log(dataAsString); // eslint-disable-line
        }
        if (dataAsString.indexOf("Can't listen") !== -1) {
          reject(dataAsString);
        }
        if (dataAsString.indexOf('App running at: ') !== -1) {
          resolve(dataAsString.substring(19));
        }
      });
    } catch (e) {
      reject(e.message);
    }
  });
};

module.exports = async config => {
  if (!mongoDBRunning) {
    await setupInMemoryMongoDB(config);
    mongoDBRunning = true;
  }
  await startAndWaitForMeteor(config);
  await wipeDatabase();
};
