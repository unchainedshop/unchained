import {
  registerPaymentCredentialsService,
  RegisterPaymentCredentialsService,
} from './registerPaymentCredentialsService';

import {
  chargeService,
  ChargeService,
} from './chargeService';

export interface PaymentServices {
  chargeService: ChargeService;
  registerPaymentCredentialsService: RegisterPaymentCredentialsService;
}

export const paymentServices: PaymentServices = {
  chargeService,
  registerPaymentCredentialsService,
};
