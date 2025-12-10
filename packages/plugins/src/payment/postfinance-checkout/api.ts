import { PostFinanceApiClient } from './api-client.js';
import {
  type Transaction,
  type TransactionCreate,
  type TransactionCompletion,
  type Token,
  type RefundCreate,
  RefundType,
} from './api-types.js';

const { PFCHECKOUT_SPACE_ID, PFCHECKOUT_USER_ID, PFCHECKOUT_SECRET } = process.env;
const SPACE_ID = parseInt(PFCHECKOUT_SPACE_ID as string, 10);
const USER_ID = parseInt(PFCHECKOUT_USER_ID as string, 10);

let apiClient: PostFinanceApiClient;

const getApiClient = () => {
  if (!apiClient) {
    apiClient = new PostFinanceApiClient({
      spaceId: SPACE_ID,
      userId: USER_ID,
      apiSecret: PFCHECKOUT_SECRET as string,
    });
  }
  return apiClient;
};

export const getTransaction = async (transactionId: string): Promise<Transaction> => {
  const client = getApiClient();
  return client.get<Transaction>(`/transaction/read?spaceId=${SPACE_ID}&id=${transactionId}`);
};

export const getTransactionCompletion = async (id: string): Promise<TransactionCompletion> => {
  const client = getApiClient();
  return client.get<TransactionCompletion>(`/transaction-completion/read?spaceId=${SPACE_ID}&id=${id}`);
};

export const getToken = async (spaceId: number, tokenId: number): Promise<Token> => {
  const client = getApiClient();
  return client.get<Token>(`/token/read?spaceId=${spaceId || SPACE_ID}&id=${tokenId}`);
};

export const createTransaction = async (transaction: TransactionCreate): Promise<number | null> => {
  const client = getApiClient();
  const result = await client.post<Transaction>(`/transaction/create?spaceId=${SPACE_ID}`, transaction);
  return result.id || null;
};

export const voidTransaction = async (transactionId: string): Promise<boolean> => {
  const client = getApiClient();
  try {
    await client.post(`/transaction-void/voidOnline?spaceId=${SPACE_ID}&id=${transactionId}`, {});
    return true;
  } catch {
    return false;
  }
};

export const refundTransaction = async (
  transactionId: string,
  orderId: string,
  amount: number,
): Promise<boolean> => {
  const client = getApiClient();
  const refund: RefundCreate = {
    transaction: parseInt(transactionId, 10),
    externalId: orderId,
    amount,
    type: RefundType.MERCHANT_INITIATED_ONLINE,
  };
  try {
    await client.post(`/refund/refund?spaceId=${SPACE_ID}`, refund);
    return true;
  } catch {
    return false;
  }
};

export const confirmDeferredTransaction = async (transactionId: string): Promise<boolean> => {
  const client = getApiClient();
  try {
    await client.post(
      `/transaction-completion/completeOnline?spaceId=${SPACE_ID}&transactionId=${transactionId}`,
      {},
    );
    return true;
  } catch {
    return false;
  }
};

export const getPaymentPageUrl = async (transactionId: number): Promise<string> => {
  const client = getApiClient();
  const result = await client.get<string>(
    `/transaction-payment-page/payment-page-url?spaceId=${SPACE_ID}&id=${transactionId}`,
  );
  return result;
};

export const getLightboxJavascriptUrl = async (transactionId: number): Promise<string> => {
  const client = getApiClient();
  const result = await client.get<string>(
    `/transaction-lightbox/javascript-url?spaceId=${SPACE_ID}&id=${transactionId}`,
  );
  return result;
};

export const getIframeJavascriptUrl = async (transactionId: number): Promise<string> => {
  const client = getApiClient();
  const result = await client.get<string>(
    `/transaction-iframe/javascript-url?spaceId=${SPACE_ID}&id=${transactionId}`,
  );
  return result;
};
