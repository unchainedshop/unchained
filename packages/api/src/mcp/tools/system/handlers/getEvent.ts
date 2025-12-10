import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';

const getEvent = async ({ modules }: Context, { eventId }: Params<'EVENT_GET'>) => {
  const event = await modules.events.findEvent({ eventId });
  return { event };
};

export default getEvent;
