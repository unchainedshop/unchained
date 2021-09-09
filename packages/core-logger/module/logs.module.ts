import { LogsModule } from 'unchained-core-types';

export const configureLogsModule = (Logs: any): LogsModule => ({
  findLogs: ({
    limit,
    offset,
    sort = {
      created: -1,
    },
  }) =>
    new Promise((resolve) => {
      const logs = Logs.find(
        {},
        {
          skip: offset,
          limit,
          sort,
        }
      ).fetch();

      resolve(logs);
    }),

  count: async () => {
    const count = await Logs.rawCollection().countDocuments();
    return count;
  },
});
