import { Root, Context } from 'unchained-core-types/api';
import { Users } from 'meteor/unchained:core-users'
import { Orders } from 'meteor/unchained:core-orders'

// we don't log this query because of reasons ;)
export default async function logs(
  root: Root,
  { limit, offset }: { limit: number; offset: number },
  { modules }: Context
) {
  const logs = await modules.logger.findLogs({ limit, offset });

  return logs.map((log) => ({
    ...log,
    user() {
      log.meta &&
      (Users as any).findOne({
        _id: (log.meta as any).userId,
      })
    },
    order() {
      return (
        log.meta &&
        (Orders as any).findOne({
          _id: (log.meta as any).orderId,
        })
      );
    },
  }));
}
