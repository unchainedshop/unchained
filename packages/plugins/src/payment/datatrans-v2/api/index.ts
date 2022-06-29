import makeFetcher from './makeFetcher';
import status from './status';
import init from './init';
import secureFields from './secureFields';
import authorize from './authorize';
import validate from './validate';
import settle from './settle';
import cancel from './cancel';
import authorizeAuthenticated from './authorizeAuthenticated';

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
