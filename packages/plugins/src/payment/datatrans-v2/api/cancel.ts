import type { FetchDatatransFn, CancelRequestPayload, CancelResponse } from './types.ts';

export default async function cancel({
  transactionId,
  ...payload
}: CancelRequestPayload): Promise<CancelResponse> {
  const reqBody = payload;
  const { fetchDatatrans }: { fetchDatatrans: FetchDatatransFn } = this;
  const result = await fetchDatatrans(`/v1/transactions/${transactionId}/cancel`, reqBody);
  if (result.status === 204) return true;
  const json = await result.json();
  return json;
}
