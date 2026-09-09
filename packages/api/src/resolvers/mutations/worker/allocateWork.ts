import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { WorkerDirector } from '@unchainedshop/core';

export default async function allocateWork(
  root: never,
  { types, worker }: { types: string[]; worker: string },
  context: Context,
) {
  log(`mutation allocateWork ${(types || []).join(',')} ${worker}`, {
    userId: context.userId,
  });

  return WorkerDirector.allocateWork(context, { types, worker });
}
