import type { FetchDatatransFn, StatusRequestPayload, StatusResponse } from './types.ts';

export default async function status({ transactionId }: StatusRequestPayload): Promise<StatusResponse> {
  const { fetchDatatrans }: { fetchDatatrans: FetchDatatransFn } = this;
  const result = await fetchDatatrans(`/v1/transactions/${transactionId}`);
  const json = (await result.json()) as StatusResponse;
  return json;
}
