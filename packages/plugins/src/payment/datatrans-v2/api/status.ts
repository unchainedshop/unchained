import { FetchDatatransFn, StatusRequestPayload, StatusResponse } from './types.js';

export default async function status({ transactionId }: StatusRequestPayload): Promise<StatusResponse> {
  const { fetchDatatrans }: { fetchDatatrans: FetchDatatransFn } = this;
  const result = await fetchDatatrans(`/v1/transactions/${transactionId}`);
  const json = await result.json();
  return json;
}
