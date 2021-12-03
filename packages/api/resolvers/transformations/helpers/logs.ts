import { Modules } from 'unchained-core-types';
import { Log } from 'unchained-core-types/logs';
import { checkTypeResolver } from '../../../acl';

export const logs =
  (metaId: string, action: string) =>
  async (
    obj: { _id: string },
    params: { offset: number; limit: number },
    context: { modules: Modules }
  ): Promise<Array<Log>> => {
    const { modules } = context;

    if (action) {
      checkTypeResolver(action, 'logs');
    }

    return modules.logs.findLogs({
      query: { [`meta.${metaId}`]: obj._id },
      offset: params.offset,
      limit: params.limit,
      sort: {
        created: -1,
      },
    });
  };
