import { UnchainedCore } from '@unchainedshop/core';
import { User } from '@unchainedshop/core-users';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ userId: string }, User>(async (queries) => {
    const userIds = [...new Set(queries.map((q) => q.userId).filter(Boolean))]; // you don't need lodash, _.unique my ass

    // It's important to also fetch deleted with the loader,
    // because the loader fetches entities by id.
    const users = await unchainedAPI.modules.users.findUsers({
      includeGuests: true,
      includeDeleted: true,
      _id: { $in: userIds },
    });

    const userMap = {};
    for (const user of users) {
      userMap[user._id] = user;
    }

    return queries.map((q) => userMap[q.userId]);
  });
