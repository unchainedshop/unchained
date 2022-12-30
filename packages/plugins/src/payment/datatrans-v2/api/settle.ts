import type { FetchDatatransFn, SettleRequestPayload, SettleResponse } from './types.js';

export default async function settle({
  transactionId,
  ...payload
}: SettleRequestPayload): Promise<SettleResponse> {
  const reqBody = payload;
  const { fetchDatatrans }: { fetchDatatrans: FetchDatatransFn } = this;
  const result = await fetchDatatrans(`/v1/transactions/${transactionId}/settle`, reqBody);
  if (result.status === 204) return true;
  const json = await result.json();
  return json;
}
