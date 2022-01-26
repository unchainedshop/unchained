import { getRegisteredEvents } from 'meteor/unchained:events';

export const generateEventTypeDefs = () => [
  /* GraphQL */ `
    extend enum EventType {
      ${getRegisteredEvents().join(',')}
    }
  `,
];
