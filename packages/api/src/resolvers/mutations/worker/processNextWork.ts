import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export default async function processNextWork(
  root: never,
  data: {
    worker?: string;
  },
  context: Context,
) {
  const { worker } = data;

  log(`mutation processNextWork ${worker}`, {
    userId: context.userId,
  });

  const work = await context.modules.worker.processNextWork(context, worker);

  return work;
}
