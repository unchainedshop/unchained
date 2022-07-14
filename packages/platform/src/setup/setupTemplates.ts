import { MessageTypes } from '@unchainedshop/types/platform';
import { MessagingDirector } from '@unchainedshop/core-messaging';
import { resolveOrderRejectionTemplate } from '../templates/resolveOrderRejectionTemplate';
import { resolveAccountActionTemplate } from '../templates/resolveAccountActionTemplate';
import { resolveForwardDeliveryTemplate } from '../templates/resolveForwardDeliveryTemplate';
import { resolveOrderConfirmationTemplate } from '../templates/resolveOrderConfirmationTemplate';
import { resolveQuotationStatusTemplate } from '../templates/resolveQuotationStatusTemplate';
import { resolveEnrollmentStatusTemplate } from '../templates/resolveEnrollmentStatusTemplate';

export const setupTemplates = () => {
  MessagingDirector.registerTemplate(MessageTypes.ACCOUNT_ACTION, resolveAccountActionTemplate);
  MessagingDirector.registerTemplate(MessageTypes.DELIVERY, resolveForwardDeliveryTemplate);
  MessagingDirector.registerTemplate(MessageTypes.ORDER_CONFIRMATION, resolveOrderConfirmationTemplate);
  MessagingDirector.registerTemplate(MessageTypes.ORDER_REJECTION, resolveOrderRejectionTemplate);
  MessagingDirector.registerTemplate(MessageTypes.QUOTATION_STATUS, resolveQuotationStatusTemplate);
  MessagingDirector.registerTemplate(MessageTypes.ENROLLMENT_STATUS, resolveEnrollmentStatusTemplate);
};
