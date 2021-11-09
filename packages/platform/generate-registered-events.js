import { getRegisteredEvents } from 'meteor/unchained:core-events';

const generateEventTypeDefs = ({ enable }) =>
  enable
    ? [
        /* GraphQL */ `
    enum EventType
    extend enum EventType {
      ${getRegisteredEvents().join(',') || ''}
    }
  `,
      ]
    : [];
export default generateEventTypeDefs;
