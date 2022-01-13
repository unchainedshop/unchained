import { getRegisteredEvents } from 'meteor/unchained:events';
import { WorkStatus } from 'meteor/unchained:core-worker';

export const generateEventTypeDefs = () => [
  /* GraphQL */ `
    extend enum EventType {
      ${getRegisteredEvents().join(',')}
    }
  `,
];
