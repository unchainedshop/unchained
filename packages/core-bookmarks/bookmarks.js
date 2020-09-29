import './db/helpers';
import runMigrations from './db/schema';

export * from './db/collections';
export default () => {
  runMigrations();
};
