import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

const getEvent = async ({ modules }: Context, { eventId }: Params<'EVENT_GET'>) => {
  const event = await modules.events.findEvent({ eventId });
  return { event };
};

export default getEvent;
