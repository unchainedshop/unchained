// https://api-reference.datatrans.ch/#operation/Authorize

import { FetchDatatransFn, AuthorizeRequestPayload, AuthorizeResponse } from './types.js';

export default async function authorize({
  ...payload
}: AuthorizeRequestPayload): Promise<AuthorizeResponse> {
  const reqBody = {
    ...payload,
    autoSettle: false,
  };

  const { fetchDatatrans }: { fetchDatatrans: FetchDatatransFn } = this;
  const result = await fetchDatatrans('/v1/transactions/authorize', reqBody);
  const json = await result.json();
  return json;
}
