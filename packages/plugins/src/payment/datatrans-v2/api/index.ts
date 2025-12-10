import makeFetcher from './makeFetcher.ts';
import status from './status.ts';
import init from './init.ts';
import secureFields from './secureFields.ts';
import authorize from './authorize.ts';
import validate from './validate.ts';
import settle from './settle.ts';
import cancel from './cancel.ts';
import authorizeAuthenticated from './authorizeAuthenticated.ts';

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
