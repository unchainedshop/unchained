import { getRegisteredEvents } from 'meteor/unchained:core-events';

const generateEventTypeDefs = () => [
  /* GraphQL */ `
    extend enum EventType {
      ${getRegisteredEvents().join(',')}
    }
  `,
];
export default generateEventTypeDefs;
