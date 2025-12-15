import type { Modules } from '../modules.ts';
import type { Filter } from '@unchainedshop/core-filters';

export async function removeFilterService(
  this: Modules,
  { filter }: { filter: Filter },
): Promise<Filter | null> {
  await this.assortments.filters.deleteMany({ filterId: filter._id });
  await this.filters.delete(filter._id);

  return filter;
}
