import { WorkerDirector } from 'meteor/unchained:core-worker';
import WorkerPlugin from 'meteor/unchained:core-worker/workers/base';

class GenerateSubscriptionOrders extends WorkerPlugin {
  static key = 'shop.unchained.worker-plugin.generate-subscription-orders';

  static label = 'Generates new Orders from Subscriptions';

  static version = '1.0';

  static type = 'SUBSCRIPTION_ORDER_GENERATOR';

  static async doWork(input) {
    console.log('GENERATE_ORDERS');
    return {
      success: true,
      result: input,
    };
  }
}

WorkerDirector.registerPlugin(GenerateSubscriptionOrders);

export default GenerateSubscriptionOrders;
