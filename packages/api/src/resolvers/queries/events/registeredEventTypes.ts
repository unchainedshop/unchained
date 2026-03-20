import { getRegisteredEvents } from '@unchainedshop/events';

export default async function registeredEventTypes() {
  return getRegisteredEvents();
}
