// https://api-reference.datatrans.ch/#operation/init
import getPaths from '../getPaths.ts';

import type { FetchDatatransFn, SecureFieldsRequestPayload, SecureFieldsResponse } from './types.ts';

const defaultRedirect = getPaths();

export default async function secureFields(
  payload: SecureFieldsRequestPayload,
): Promise<SecureFieldsResponse> {
  const reqBody = {
    returnUrl: defaultRedirect.returnUrl,
    ...payload,
  };
  const { fetchDatatrans }: { fetchDatatrans: FetchDatatransFn } = this;
  const result = await fetchDatatrans('/v1/transactions/secureFields', reqBody);
  const json = await result.json();
  return json;
}
