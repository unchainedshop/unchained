import { Context } from '../../../../context.js';
import { EventCountOptions } from '../types.js';

const countEvents = async ({ modules }: Context, options?: EventCountOptions) => {
  const count = await modules.events.count(options || {});
  return { count };
};

export default countEvents;
