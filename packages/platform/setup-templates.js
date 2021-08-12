import { MessagingDirector } from 'meteor/unchained:core-messaging';
import accountActionTemplate from './templates/account-action';
import forwardDeliveryTemplate from './templates/forward-delivery';
import orderConfirmationTemplate from './templates/order-confirmation';
import quotationStatusTemplate from './templates/quotation-status';
import enrollmentStatusTemplate from './templates/enrollment-status';

export const MessageTypes = {
  ACCOUNT_ACTION: 'ACCOUNT_ACTION',
  DELIVERY: 'DELIVERY',
  ORDER_CONFIRMATION: 'ORDER_CONFIRMATION',
  QUOTATION_STATUS: 'QUOTATION_STATUS',
  ENROLLMENT_STATUS: 'ENROLLMENT_STATUS',
};

export default () => {
  MessagingDirector.configureTemplate(
    MessageTypes.ACCOUNT_ACTION,
    accountActionTemplate
  );
  MessagingDirector.configureTemplate(
    MessageTypes.DELIVERY,
    forwardDeliveryTemplate
  );
  MessagingDirector.configureTemplate(
    MessageTypes.ORDER_CONFIRMATION,
    orderConfirmationTemplate
  );
  MessagingDirector.configureTemplate(
    MessageTypes.QUOTATION_STATUS,
    quotationStatusTemplate
  );
  MessagingDirector.configureTemplate(
    MessageTypes.ENROLLMENT_STATUS,
    enrollmentStatusTemplate
  );
};
