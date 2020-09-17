import './db/quotations/helpers';
import './db/quotation-documents/helpers';

import './db/quotations/factories';
import './db/quotation-documents/factories';

import runMigrations from './db/quotations/schema';

export * from './director';
export * from './db/quotations/collections';
export * from './db/quotation-documents/collections';
export * from './db/quotations/schema';
export * from './db/quotation-documents/schema';

export default () => {
  runMigrations();
};
