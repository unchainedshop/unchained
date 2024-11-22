import { FetchDatatransFn, ValidateRequestPayload, ValidateResponse } from './types.js';

export default async function validate(payload: ValidateRequestPayload): Promise<ValidateResponse> {
  const { fetchDatatrans }: { fetchDatatrans: FetchDatatransFn } = this;

  const reqBody = {
    ...payload,
  };

  const result = await fetchDatatrans(`/v1/transactions/validate`, reqBody);
  const json = await result.json();
  return json;
}
