import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export default async function allocateWork(
  root: never,
  { types, worker }: { types?: string[]; worker?: string },
  { modules, userId }: Context,
) {
  log(`mutation allocateWork ${(types || []).join(',')} ${worker}`, {
    userId,
  });

  return modules.worker.allocateWork({ types, worker });
}
