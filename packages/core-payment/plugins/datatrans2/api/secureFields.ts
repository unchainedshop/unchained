// https://api-reference.datatrans.ch/#operation/init

import type {
  FetchDatatransFn,
  SecureFieldsRequestPayload,
  SecureFieldsResponse,
} from './types';

const { ROOT_URL } = process.env;

export default async function secureFields(
  payload: SecureFieldsRequestPayload
): Promise<SecureFieldsResponse> {
  const reqBody = {
    returnUrl: `${ROOT_URL}/payment/datatrans/secure-fields-return`,
    ...payload,
  };
  const { fetchDatatrans }: { fetchDatatrans: FetchDatatransFn } = this;
  const result = await fetchDatatrans('/v1/transactions/secureFields', reqBody);
  const json = await result.json();
  return json;
}
