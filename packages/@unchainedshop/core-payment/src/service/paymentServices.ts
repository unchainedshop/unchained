import { PaymentServices } from '@unchainedshop/types/payments';
import { chargeService } from './chargeService';
import { cancelService } from './cancelService';
import { confirmService } from './confirmService';
import { registerPaymentCredentialsService } from './registerPaymentCredentialsService';

export const paymentServices: PaymentServices = {
  charge: chargeService,
  registerPaymentCredentials: registerPaymentCredentialsService,
  cancel: cancelService,
  confirm: confirmService,
};
