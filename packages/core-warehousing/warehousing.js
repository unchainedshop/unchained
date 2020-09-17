import runMigrations from './db/schema';

export * from './db';
export * from './director';
export default () => {
  runMigrations();
};
