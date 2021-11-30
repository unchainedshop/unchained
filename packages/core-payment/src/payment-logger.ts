import { Logger } from '@unchainedshop/types/logs';
import { createLogger } from 'meteor/unchained:logger';

export const paymentLogger: Logger = createLogger('unchained:core-payment');
