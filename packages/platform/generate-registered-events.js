import { getRegisteredEvents } from 'unchained-events';

const generateEventTypeDefs = () => [
  /* GraphQL */ `
    extend enum EventType {
      ${getRegisteredEvents().join(',')}
    }
  `,
];
export default generateEventTypeDefs;
