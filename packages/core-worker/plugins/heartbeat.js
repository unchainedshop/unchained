import WorkerPlugin from './base';

class Heartbeat extends WorkerPlugin {
  static key = 'shop.unchained.worker-plugin.heartbeat';

  static label = 'Heartbeat plugin to check if workers are working';

  static version = '1.0';

  static type = 'HEARTBEAT';

  static doWork(input) {
    if (input && input.fails) {
      return {
        success: false,
        result: input
      };
    }
    return {
      success: true,
      result: input
    };
  }
}

export default Heartbeat;
