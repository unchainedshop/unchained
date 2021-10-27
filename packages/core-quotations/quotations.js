import './db/quotations/helpers';
import './db/quotation-documents/helpers';

import createIndexes from './db/quotations/schema';
import settings from './settings';

export * from './director';
export * from './db/quotations/collections';
export * from './db/quotations/schema';
export * from './db/quotation-documents/schema';

export default (options) => {
  settings.load(options);
  createIndexes();
};
