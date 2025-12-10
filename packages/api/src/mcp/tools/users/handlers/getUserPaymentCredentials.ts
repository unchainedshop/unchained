import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';

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
