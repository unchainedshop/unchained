import { Context } from '../../../../context.js';

const getEvent = async ({ modules }: Context, { eventId }: { eventId: string }) => {
  const event = await modules.events.findEvent({ eventId });
  return { event };
};

export default getEvent;
