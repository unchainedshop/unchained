import scalars from './scalars.js';
import directives from './directives.js';
import types from './types/index.js';
import inputTypes from './inputTypes.js';
import query from './query.js';
import mutation from './mutation.js';

export const buildDefaultTypeDefs = ({ actions = [], events = [], workTypes = [] }) => {
  const dynamicTypeDefs = `
    extend enum RoleAction {
        ${actions.join(',')}
    }
    extend enum EventType {
        ${events.join(',')}
    }
    extend enum WorkType {
        ${workTypes.join(',')}
    }
  `;

  return [...scalars, ...directives, ...types, ...inputTypes, ...query, ...mutation, dynamicTypeDefs];
};
