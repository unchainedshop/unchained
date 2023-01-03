import makeFetcher from './makeFetcher.js';
import status from './status.js';
import init from './init.js';
import secureFields from './secureFields.js';
import authorize from './authorize.js';
import validate from './validate.js';
import settle from './settle.js';
import cancel from './cancel.js';
import authorizeAuthenticated from './authorizeAuthenticated.js';

export default function createDatatransAPI(endpoint: string, merchantId: string, secret: string) {
  const fetchDatatrans = makeFetcher(endpoint, merchantId, secret);
  return {
    fetchDatatrans,
    init,
    authorize,
    validate,
    secureFields,
    status,
    authorizeAuthenticated,
    settle,
    cancel,
  };
}
