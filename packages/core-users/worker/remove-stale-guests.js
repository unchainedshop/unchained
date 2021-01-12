import { WorkerDirector } from 'meteor/unchained:core-worker';
import WorkerPlugin from 'meteor/unchained:core-worker/workers/base';

class RemoveStaleGuests extends WorkerPlugin {
  static key = 'shop.unchained.worker-plugin.remove-stale-guests';

  static label = 'Remove Stale Guest Users';

  static version = '1.0';

  static type = 'REMOVE_STALE_GUESTS';

  static async doWork(input) {
    const users = Users.find({
      guest: true,
      'services.resume.loginTokens.when': { $not: { gt: new Date() } },
    }).fetch();
    console.log(users);

    // if (errors.length) {
    //   return {
    //     success: false,
    //     error: {
    //       name: 'SOME_SUBSCRIPTIONS_COULD_NOT_PROCESS',
    //       message: 'Some errors have been reported during order generation',
    //       logs: errors,
    //     },
    //     result: {},
    //   };
    // }
    return {
      success: true,
      result: input,
    };
  }
}

WorkerDirector.registerPlugin(RemoveStaleGuests);

export default RemoveStaleGuests;
