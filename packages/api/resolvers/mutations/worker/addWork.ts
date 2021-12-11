import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { WorkData } from '@unchainedshop/types/worker';

export default async function addWork(
  root: Root,
  workData: WorkData,
  { modules, userId }: Context
) {
  const { type, input } = workData;

  log(`mutation addWork ${type} ${JSON.stringify(input)}`, { userId });

  return await modules.worker.addWork(workData, userId);
}
