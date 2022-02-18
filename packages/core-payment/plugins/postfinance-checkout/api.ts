import { PostFinanceCheckout } from 'postfinancecheckout';

const { PFCHECKOUT_SPACE_ID, PFCHECKOUT_USER_ID, PFCHECKOUT_SECRET } = process.env;
const SPACE_ID = parseInt(PFCHECKOUT_SPACE_ID, 10);
const USER_ID = parseInt(PFCHECKOUT_USER_ID, 10);

const getConfig = () => {
  return {
    space_id: SPACE_ID,
    user_id: USER_ID,
    api_secret: PFCHECKOUT_SECRET,
  };
};

const getTransactionService = () => {
  return new PostFinanceCheckout.api.TransactionService(getConfig());
};

const getTransactionPaymentPageService = () => {
  return new PostFinanceCheckout.api.TransactionPaymentPageService(getConfig());
};

const getTransactionIframeService = () => {
  return new PostFinanceCheckout.api.TransactionIframeService(getConfig());
};

const getTransactionLightboxService = () => {
  return new PostFinanceCheckout.api.TransactionLightboxService(getConfig());
};

export const createTransaction = async (
  transaction: PostFinanceCheckout.model.TransactionCreate,
): Promise<number> => {
  const transactionService = getTransactionService();
  const transactionCreateRes = await transactionService.create(SPACE_ID, transaction);
  const transactionCreate = transactionCreateRes.body;
  return transactionCreate.id;
};

export const getPaymentPageUrl = async (transactionId: number): Promise<string> => {
  const transactionPaymentPageService = getTransactionPaymentPageService();
  const paymentPageUrl = await transactionPaymentPageService.paymentPageUrl(SPACE_ID, transactionId);
  return paymentPageUrl.body;
};

export const getLightboxJavascriptUrl = async (transactionId: number): Promise<string> => {
  const transactionLightboxService = getTransactionLightboxService();
  const javascriptUrl = await transactionLightboxService.javascriptUrl(SPACE_ID, transactionId);
  return javascriptUrl.body;
};

export const getIframeJavascriptUrl = async (transactionId: number): Promise<string> => {
  const transactionIframeService = getTransactionIframeService();
  const javascriptUrl = await transactionIframeService.javascriptUrl(SPACE_ID, transactionId);
  return javascriptUrl.body;
};
