import runMigrations from './db/schema';

export * from './director';
export * from './db';

export default () => {
  runMigrations();
};
