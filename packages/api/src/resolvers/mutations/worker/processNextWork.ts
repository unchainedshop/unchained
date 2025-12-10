import { WorkerDirector } from '@unchainedshop/core';
import type { Context } from '../../../context.ts';
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

  const work = WorkerDirector.processNextWork(context, worker);

  return work;
}
