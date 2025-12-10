import type { Context } from '../../../../context.ts';
import type { EventCountOptions } from '../types.ts';

const countEvents = async ({ modules }: Context, options?: EventCountOptions) => {
  const count = await modules.events.count(options || {});
  return { count };
};

export default countEvents;
