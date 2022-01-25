import { MessagingDirector } from 'meteor/unchained:core-messaging';
import { resolveAccountActionTemplate } from '../templates/resolveAccountActionTemplate';
import { resolveForwardDeliveryTemplate } from '../templates/resolveForwardDeliveryTemplate';
import { resolveOrderConfirmationTemplate } from '../templates/resolveOrderConfirmationTemplate';
import { resolveQuotationStatusTemplate } from '../templates/resolveQuotationStatusTemplate';
import { resolveEnrollmentStatusTemplate } from '../templates/resolveEnrollmentStatusTemplate';

export const MessageTypes = {
  ACCOUNT_ACTION: 'ACCOUNT_ACTION',
  DELIVERY: 'DELIVERY',
  ORDER_CONFIRMATION: 'ORDER_CONFIRMATION',
  QUOTATION_STATUS: 'QUOTATION_STATUS',
  ENROLLMENT_STATUS: 'ENROLLMENT_STATUS',
};

export const setupTemplates = () => {
  MessagingDirector.registerTemplate(
    MessageTypes.ACCOUNT_ACTION,
    resolveAccountActionTemplate
  );
  MessagingDirector.registerTemplate(
    MessageTypes.DELIVERY,
    resolveForwardDeliveryTemplate
  );
  MessagingDirector.registerTemplate(
    MessageTypes.ORDER_CONFIRMATION,
    resolveOrderConfirmationTemplate
  );
  MessagingDirector.registerTemplate(
    MessageTypes.QUOTATION_STATUS,
    resolveQuotationStatusTemplate
  );
  MessagingDirector.registerTemplate(
    MessageTypes.ENROLLMENT_STATUS,
    resolveEnrollmentStatusTemplate
  );
};