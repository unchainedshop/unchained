import type { Context } from '../../../../context.ts';

export interface EventCountOptions {
  queryString?: string;
  created?: {
    start?: Date;
    end?: Date;
  };
  types?: string[];
}

const countEvents = async ({ modules }: Context, options?: EventCountOptions) => {
  const count = await modules.events.count(options || {});
  return { count };
};

export default countEvents;
