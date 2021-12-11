import { WorkerDirector, WorkerPlugin } from 'meteor/unchained:core-worker';

const wait = async (time: number) => {
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

const Heartbeat: WorkerPlugin<Arg, Result> = {
  key: 'shop.unchained.worker-plugin.heartbeat',
  label: 'Heartbeat plugin to check if workers are working',
  version: '1.0',
  type: 'HEARTBEAT',

  async doWork(input) {
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
  },
};

WorkerDirector.registerPlugin(Heartbeat);

export default Heartbeat;
