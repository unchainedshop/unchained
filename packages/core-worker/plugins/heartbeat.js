import { WorkerDirector } from 'meteor/unchained:core-worker';
import WorkerPlugin from './base';

const wait = async (time) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

class Heartbeat extends WorkerPlugin {
  static key = 'shop.unchained.worker-plugin.heartbeat';

  static label = 'Heartbeat plugin to check if workers are working';

  static version = '1.0';

  static type = 'HEARTBEAT';

  static async doWork(input) {
    if (input?.wait) {
      await wait(input.wait);
    }
    if (input?.fails) {
      return {
        success: false,
        result: input,
      };
    }
    return {
      success: true,
      result: input,
    };
  }
}

WorkerDirector.registerPlugin(Heartbeat);

export default Heartbeat;
