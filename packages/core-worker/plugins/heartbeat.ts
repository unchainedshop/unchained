import {
  WorkerDirector,
  WorkerPlugin,
  DoWorkReturn,
} from 'meteor/unchained:core-worker';

const wait = async (time) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

type Arg = {
  wait?: number;
  fails?: boolean;
};

type Result = Arg;

class Heartbeat extends WorkerPlugin<Arg, Result> {
  static key = 'shop.unchained.worker-plugin.heartbeat';

  static label = 'Heartbeat plugin to check if workers are working';

  static version = '1.0';

  static type = 'HEARTBEAT';

  static async doWork(input: Arg): Promise<DoWorkReturn<Result>> {
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
