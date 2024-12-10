import {
  Order,
  OrderDelivery,
  OrderDeliveryStatus,
  OrderPayment,
  OrderPaymentStatus,
  OrderStatus,
} from '@unchainedshop/core-orders';
import { Modules } from '../modules.js';
import { createEnrollmentFromCheckoutService } from './createEnrollmentFromCheckout.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';
import { WarehousingDirector, DeliveryDirector, PaymentDirector } from '../directors/index.js';
import { fullfillQuotationService } from './fullfillQuotation.js';

const isAutoConfirmationEnabled = async (
  {
    orderPayment,
    orderDelivery,
  }: {
    orderPayment: OrderPayment;
    orderDelivery: OrderDelivery;
  },
  unchainedAPI: { modules: Modules },
) => {
  if (orderPayment.status !== OrderPaymentStatus.PAID) {
    const provider = await unchainedAPI.modules.payment.paymentProviders.findProvider({
      paymentProviderId: orderPayment.paymentProviderId,
    });
    const actions = await PaymentDirector.actions(provider, {}, unchainedAPI);
    if (!actions.isPayLaterAllowed()) return false;
  }

  if (orderDelivery.status !== OrderDeliveryStatus.DELIVERED) {
    const deliveryProvider = await unchainedAPI.modules.delivery.findProvider({
      deliveryProviderId: orderDelivery.deliveryProviderId,
    });
    const director = await DeliveryDirector.actions(deliveryProvider, {}, unchainedAPI);
    if (!director.isAutoReleaseAllowed()) return false;
  }

  return true;
};

const findNextStatus = async (
  status: OrderStatus | null,
  order: Order,
  unchainedAPI,
): Promise<OrderStatus | null> => {
  const { modules } = unchainedAPI;

  if (status === null) {
    return OrderStatus.PENDING;
  }

  if (status === OrderStatus.FULLFILLED || status === OrderStatus.REJECTED) {
    // Final!
    return status;
  }

  const orderPayment = await modules.orders.payments.findOrderPayment({
    orderPaymentId: order.paymentId,
  });
  if (!orderPayment) return status;

  const orderDelivery = await modules.orders.deliveries.findDelivery({
    orderDeliveryId: order.deliveryId,
  });
  if (!orderDelivery) return status;

  // Ok, we have a payment and a delivery and the correct status,
  // let's check if we can auto-confirm or auto-fulfill
  if (status === OrderStatus.PENDING) {
    if (await isAutoConfirmationEnabled({ orderPayment, orderDelivery }, unchainedAPI)) {
      return OrderStatus.CONFIRMED;
    }
  }
  if (status === OrderStatus.CONFIRMED) {
    const readyForFullfillment =
      orderDelivery.status === OrderDeliveryStatus.DELIVERED &&
      orderPayment.status === OrderPaymentStatus.PAID;
    if (readyForFullfillment) {
      return OrderStatus.FULLFILLED;
    }
  }

  return status;
};

export const processOrderService = async (
  initialOrder: Order,
  orderTransactionContext: {
    paymentContext?: any;
    deliveryContext?: any;
    comment?: string;
    nextStatus?: OrderStatus;
  },
  unchainedAPI: { modules: Modules },
) => {
  const { modules } = unchainedAPI;
  const {
    paymentContext,
    deliveryContext,
    nextStatus: forceNextStatus,
    comment,
  } = orderTransactionContext;

  const orderId = initialOrder._id;
  let order = initialOrder;
  let nextStatus = forceNextStatus || (await findNextStatus(initialOrder.status, order, unchainedAPI));

  if (nextStatus === OrderStatus.PENDING) {
    // auto charge during transition to pending
    const orderPayment = await modules.orders.payments.findOrderPayment({
      orderPaymentId: order.paymentId,
    });

    await PaymentDirector.chargeOrderPayment(
      orderPayment,
      { userId: order.userId, transactionContext: paymentContext },
      unchainedAPI,
    );

    nextStatus = await findNextStatus(nextStatus, order, unchainedAPI);
  }

  if (nextStatus === OrderStatus.REJECTED) {
    // auto cancel during transition to rejected
    const orderPayment = await modules.orders.payments.findOrderPayment({
      orderPaymentId: order.paymentId,
    });
    await PaymentDirector.cancelOrderPayment(
      orderPayment,
      { userId: order.userId, transactionContext: paymentContext },
      unchainedAPI,
    );
  }

  if (nextStatus === OrderStatus.CONFIRMED) {
    // confirm pre-authorized payments
    const orderPayment = await modules.orders.payments.findOrderPayment({
      orderPaymentId: order.paymentId,
    });
    await PaymentDirector.confirmOrderPayment(
      orderPayment,
      { userId: order.userId, transactionContext: paymentContext },
      unchainedAPI,
    );
    if (order.status !== OrderStatus.CONFIRMED) {
      // we have to stop here shortly to complete the confirmation
      // before auto delivery is started, else we have no chance to create
      // numbers that are needed for delivery
      order = await modules.orders.updateStatus(orderId, {
        status: OrderStatus.CONFIRMED,
        info: comment,
      });

      const orderDelivery = await modules.orders.deliveries.findDelivery({
        orderDeliveryId: order.deliveryId,
      });

      await DeliveryDirector.sendOrderDelivery(orderDelivery, deliveryContext, unchainedAPI);

      const orderPositions = await modules.orders.positions.findOrderPositions({ orderId });
      const mappedProductOrderPositions = await Promise.all(
        orderPositions.map(async (orderPosition) => {
          const product = await modules.products.findProduct({
            productId: orderPosition.productId,
          });
          return {
            orderPosition,
            product,
          };
        }),
      );
      const tokenizedItems = mappedProductOrderPositions.filter(
        (item) => item.product?.type === ProductTypes.TokenizedProduct,
      );
      if (tokenizedItems.length > 0) {
        // Give virtual warehouse a chance to instantiate new virtual objects
        const virtualProviders = await modules.warehousing.findProviders({
          type: WarehousingProviderType.VIRTUAL,
        });
        // It's very important to do this in a series and not in Promise.all
        // TODO: Actually, only createTokens should decide on the unique chainTokenId
        // and the tokens should be created with a distributed Lock to not assign the same id multiple times!
        for (const { orderPosition, product } of tokenizedItems) {
          for (const virtualProvider of virtualProviders) {
            const adapterActions = await WarehousingDirector.actions(
              virtualProvider,
              {
                order,
                orderPosition,
                product,
                quantity: orderPosition.quantity,
                referenceDate: order.ordered,
              },
              unchainedAPI,
            );
            const isActive = await adapterActions.isActive();
            if (isActive) {
              const tokens = await adapterActions.tokenize();
              await modules.warehousing.createTokens(tokens);
            }
          }
        }
      }

      // Enrollments: Generate enrollments for plan products
      const planItems = mappedProductOrderPositions.filter(
        (item) => item.product?.type === ProductTypes.PlanProduct && !order.originEnrollmentId,
      );
      if (planItems.length > 0) {
        await createEnrollmentFromCheckoutService(
          order,
          {
            items: planItems,
            context: {
              paymentContext,
              deliveryContext,
            },
          },
          unchainedAPI,
        );
      }

      // Quotations: If we came here, the checkout succeeded, so we can fullfill underlying quotations
      const quotationItems = mappedProductOrderPositions.filter(
        (item) => item.orderPosition.quotationId,
      );
      await Promise.all(
        quotationItems.map(async ({ orderPosition }) => {
          const quotation = await modules.quotations.findQuotation({
            quotationId: orderPosition.quotationId,
          });
          await fullfillQuotationService(
            quotation,
            {
              orderId,
              orderPositionId: orderPosition._id,
            },
            unchainedAPI,
          );
        }),
      );
    }

    nextStatus = await findNextStatus(nextStatus, order, unchainedAPI);
  }

  return modules.orders.updateStatus(order._id, { status: nextStatus, info: comment });
};
