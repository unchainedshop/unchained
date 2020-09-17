import runMigrations from './db/schema';

export * from './db';

export default () => {
  runMigrations();
};
