import scalars from './scalars';
import directives from './directives';
import types from './types';
import inputTypes from './inputTypes';
import query from './query';
import mutation from './mutation';

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
