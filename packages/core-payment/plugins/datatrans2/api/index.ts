import makeFetcher from './makeFetcher';
import status from './status';
import init from './init';

export default function createDatatransAPI(
  endpoint: string,
  merchantId: string,
  secret: string
) {
  const fetchDatatrans = makeFetcher(endpoint, merchantId, secret);
  return {
    fetchDatatrans,
    init,
    status,
  };
}
