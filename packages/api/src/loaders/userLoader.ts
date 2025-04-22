import { UnchainedCore } from '@unchainedshop/core';
import { User } from '@unchainedshop/core-users';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ userId: string }, User>(async (queries) => {
    const userIds = [...new Set(queries.map((q) => q.userId).filter(Boolean))]; // you don't need lodash, _.unique my ass

    const users = await unchainedAPI.modules.users.findUsers({
      _id: { $in: userIds },
    });

    const userMap = {};
    for (const user of users) {
      userMap[user._id] = user;
    }

    return queries.map((q) => userMap[q.userId]);
  });
