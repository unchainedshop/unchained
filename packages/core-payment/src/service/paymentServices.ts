import { PaymentServices } from '@unchainedshop/types/payments';
import { chargeService } from './chargeService';
import { registerPaymentCredentialsService } from './registerPaymentCredentialsService';

export const paymentServices: PaymentServices = {
  chargeService,
  registerPaymentCredentialsService,
};
