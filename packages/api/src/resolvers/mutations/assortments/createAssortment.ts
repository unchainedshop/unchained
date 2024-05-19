import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { Assortment, AssortmentText } from '@unchainedshop/types/assortments.js';

export default async function createAssortment(
  root: Root,
  { assortment }: { assortment: Assortment & { texts: AssortmentText } },
  { modules, userId }: Context,
) {
  log('mutation createAssortment', { userId });

  const assortmentId = await modules.assortments.create({
    ...assortment,
  });

  return modules.assortments.findAssortment({ assortmentId });
}
