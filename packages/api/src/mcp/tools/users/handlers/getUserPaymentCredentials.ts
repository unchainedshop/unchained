import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

export default async function getUserPaymentCredentials(
  context: Context,
  params: Params<'GET_PAYMENT_CREDENTIALS'>,
) {
  const { modules } = context;
  const { userId } = params;
  const credentials = await modules.payment.paymentCredentials.findPaymentCredentials(
    { userId },
    {
      sort: {
        created: -1,
      },
    },
  );

  return { credentials };
}
