import { Modules } from 'unchained-core-types';
import { LogsModule } from 'unchained-core-types/logs';

export const logs =
  (
    modules: Modules,
    metaId: string,
    obj: { _id: string }
  ): LogsModule['findLogs'] =>
  async ({ offset, limit }) => {
    return await modules.logs.findLogs({
      query: { [`meta.${metaId}`]: obj._id },
      offset,
      limit,
      sort: {
        created: -1,
      },
    });
  };
