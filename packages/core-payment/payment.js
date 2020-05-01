import './db/factories';
import './db/helpers';
import runMigrations from './db/schema';
import { PaymentDirector } from './director';

export * from './db/schema';
export * from './db/collections';
export * from './director';

export default ({ sortProviders } = {}) => {
  // configure
  PaymentDirector.setSortProviders(sortProviders);
  runMigrations();
};
