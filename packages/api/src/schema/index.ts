import scalars from './scalars.js';
import directives from './directives.js';
import types from './types/index.js';
import inputTypes from './inputTypes.js';
import query from './query.js';
import mutation from './mutation.js';

export const buildDefaultTypeDefs = ({ actions = [], events = [], workTypes = [] }) => {
  const dynamicTypeDefs = [
    actions?.length && `extend enum RoleAction { ${actions.join(',')} }`,
    events?.length && `extend enum EventType { ${events.join(',')} }`,
    workTypes?.length && `extend enum WorkType { ${workTypes.join(',')} }`,
  ].filter(Boolean);

  return [...scalars, ...directives, ...types, ...inputTypes, ...query, ...mutation, ...dynamicTypeDefs];
};
