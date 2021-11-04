import { EventDirector } from 'meteor/unchained:core-events';

const generateEventTypeDefs = () => [
  /* GraphQL */ `
    extend enum EventType {
      ${EventDirector.getRegisteredEvents().join(',')}
    }
  `,
];
export default generateEventTypeDefs;
