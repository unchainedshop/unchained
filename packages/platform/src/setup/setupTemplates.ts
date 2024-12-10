import { MessagingDirector, UnchainedCore } from '@unchainedshop/core';
import { subscribe } from '@unchainedshop/events';
import { Order, OrderStatus } from '@unchainedshop/core-orders';
import { RawPayloadType } from '@unchainedshop/events';
import { resolveOrderRejectionTemplate } from '../templates/resolveOrderRejectionTemplate.js';
import { resolveAccountActionTemplate } from '../templates/resolveAccountActionTemplate.js';
import { resolveForwardDeliveryTemplate } from '../templates/resolveForwardDeliveryTemplate.js';
import { resolveOrderConfirmationTemplate } from '../templates/resolveOrderConfirmationTemplate.js';
import { resolveQuotationStatusTemplate } from '../templates/resolveQuotationStatusTemplate.js';
import { resolveEnrollmentStatusTemplate } from '../templates/resolveEnrollmentStatusTemplate.js';
import { resolveErrorReportTemplate } from '../templates/resolveErrorReportTemplate.js';

export enum MessageTypes {
  ACCOUNT_ACTION = 'ACCOUNT_ACTION',
  DELIVERY = 'DELIVERY',
  ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
  ORDER_REJECTION = 'ORDER_REJECTION',
  QUOTATION_STATUS = 'QUOTATION_STATUS',
  ENROLLMENT_STATUS = 'ENROLLMENT_STATUS',
  ERROR_REPORT = 'ERROR_REPORT',
}

export const setupTemplates = (unchainedAPI: UnchainedCore) => {
  MessagingDirector.registerTemplate(MessageTypes.ACCOUNT_ACTION, resolveAccountActionTemplate);
  MessagingDirector.registerTemplate(MessageTypes.DELIVERY, resolveForwardDeliveryTemplate);
  MessagingDirector.registerTemplate(MessageTypes.ORDER_CONFIRMATION, resolveOrderConfirmationTemplate);
  MessagingDirector.registerTemplate(MessageTypes.ORDER_REJECTION, resolveOrderRejectionTemplate);
  MessagingDirector.registerTemplate(MessageTypes.QUOTATION_STATUS, resolveQuotationStatusTemplate);
  MessagingDirector.registerTemplate(MessageTypes.ENROLLMENT_STATUS, resolveEnrollmentStatusTemplate);
  MessagingDirector.registerTemplate(MessageTypes.ERROR_REPORT, resolveErrorReportTemplate);

  subscribe('ORDER_CHECKOUT', async ({ payload }: RawPayloadType<{ order: Order }>) => {
    const { order } = payload;
    const user = await unchainedAPI.modules.users.findUserById(order.userId);
    const locale = unchainedAPI.modules.users.userLocale(user);

    if (order.status === OrderStatus.PENDING) {
      // We only send the "confirmation" when pending, else we let the other events handle it
      await unchainedAPI.modules.worker.addWork({
        type: 'MESSAGE',
        retries: 0,
        input: {
          locale,
          template: MessageTypes.ORDER_CONFIRMATION,
          orderId: order._id,
        },
      });
    }
  });

  subscribe('ORDER_CONFIRMED', async ({ payload }: RawPayloadType<{ order: Order }>) => {
    const { order } = payload;
    const user = await unchainedAPI.modules.users.findUserById(order.userId);
    const locale = unchainedAPI.modules.users.userLocale(user);

    await unchainedAPI.modules.worker.addWork({
      type: 'MESSAGE',
      retries: 0,
      input: {
        locale,
        template: MessageTypes.ORDER_CONFIRMATION,
        orderId: order._id,
      },
    });
  });

  subscribe('ORDER_REJECTED', async ({ payload }: RawPayloadType<{ order: Order }>) => {
    const { order } = payload;
    const user = await unchainedAPI.modules.users.findUserById(order.userId);
    const locale = unchainedAPI.modules.users.userLocale(user);

    await unchainedAPI.modules.worker.addWork({
      type: 'MESSAGE',
      retries: 0,
      input: {
        locale,
        template: MessageTypes.ORDER_REJECTION,
        orderId: order._id,
      },
    });
  });
};
