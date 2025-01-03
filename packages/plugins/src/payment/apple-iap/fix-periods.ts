import { UnchainedCore } from '@unchainedshop/core';

export const fixPeriods = async (
  { transactionId, enrollmentId, orderId, transactions },
  unchainedAPI: UnchainedCore,
) => {
  const relevantTransactions = transactions.filter(
    // eslint-disable-next-line
    ({ original_transaction_id }) => {
      return original_transaction_id === transactionId; // eslint-disable-line
    },
  );

  const adjustedEnrollmentPeriods = relevantTransactions
    .map((transaction) => {
      return {
        isTrial: transaction.is_trial_period === 'true', // eslint-disable-line
        start: new Date(parseInt(transaction.purchase_date_ms, 10)),
        end: new Date(parseInt(transaction.expires_date_ms, 10)),
        orderId: transaction.transaction_id === transactionId ? orderId : null,
      };
    })
    .toSorted((left, right) => {
      return left.end.getTime() - right.end.getTime();
    });

  await unchainedAPI.modules.enrollments.removeEnrollmentPeriodByOrderId(enrollmentId, orderId);

  return Promise.all(
    adjustedEnrollmentPeriods.map((period) =>
      unchainedAPI.modules.enrollments.addEnrollmentPeriod(enrollmentId, period),
    ),
  );
};
