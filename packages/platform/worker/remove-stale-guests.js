import { WorkerDirector } from 'meteor/unchained:core-worker';
import WorkerPlugin from 'meteor/unchained:core-worker/workers/base';
import { Users } from 'meteor/unchained:core-users';

class RemoveStaleGuests extends WorkerPlugin {
  static key = 'shop.unchained.worker-plugin.remove-stale-guests';

  static label = 'Remove Stale Guest Users';

  static version = '1.0';

  static type = 'REMOVE_STALE_GUESTS';

  static async doWork(input) {
    const guests = await Users.findStaleGuests();
    // await Promise.all(
    //   guests.map(async (user) => {
    //     await Users.removeUser({ userId: user._id });
    //   })
    // );

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
