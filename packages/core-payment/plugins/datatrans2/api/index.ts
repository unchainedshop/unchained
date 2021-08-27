import makeFetcher from './makeFetcher';
import getTransaction from './getTransaction';
import init from './init';
import initSecureFields from './initSecureFields';

export default function createDatatransAPI(
  endpoint: string,
  merchantId: string,
  secret: string
) {
  const fetchDatatrans = makeFetcher(endpoint, merchantId, secret);
  return {
    fetchDatatrans,
    init,
    initSecureFields,
    getTransaction,
  };
}
