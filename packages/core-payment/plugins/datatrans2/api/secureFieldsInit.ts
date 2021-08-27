// https://api-reference.datatrans.ch/#operation/init

import type {
  FetchDatatransFn,
  InitSecureFieldsRequestPayload,
  InitResponse,
} from './types';

const { ROOT_URL } = process.env;

export default async function initSecureFields(
  payload: InitSecureFieldsRequestPayload
): Promise<InitResponse> {
  const reqBody = payload;
  const { fetchDatatrans }: { fetchDatatrans: FetchDatatransFn } = this;
  const result = await fetchDatatrans('/v1/transactions/secureFields', reqBody);
  const json = await result.json();
  const location = result.headers.get('location');
  return {
    location,
    ...json,
  };
}
