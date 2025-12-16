import type { UnchainedCore } from '@unchainedshop/core';
import type { User } from '@unchainedshop/core-users';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ userId: string }, User>(async (queries) => {
    const userIds = [...new Set(queries.map((q) => q.userId).filter(Boolean))];

    // It's important to also fetch deleted with the loader,
    // because the loader fetches entities by id.
    const users = await unchainedAPI.modules.users.findUsers({
      includeGuests: true,
      includeDeleted: true,
      userIds,
    });

    const userMap = {};
    for (const user of users) {
      userMap[user._id] = user;
    }

    return queries.map((q) => userMap[q.userId]);
  });
