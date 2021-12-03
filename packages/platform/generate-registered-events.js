import { getRegisteredEvents } from 'meteor/unchained:events';

const generateEventTypeDefs = () => [
  /* GraphQL */ `
    extend enum EventType {
      ${getRegisteredEvents().join(',')}
    }
  `,
];
export default generateEventTypeDefs;
