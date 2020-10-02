import configureSchema from './db/schema';

export * from './db/helpers';
export * from './db/schema';
export * from './db/collections';
export * from './director';

export default () => {
  configureSchema();
};
