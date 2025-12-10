import {
  type Order,
  type OrderDelivery,
  OrderDeliveryStatus,
  type OrderPayment,
  OrderPaymentStatus,
  type OrderPosition,
  OrderStatus,
} from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import { createEnrollmentFromCheckoutService } from './createEnrollmentFromCheckout.ts';
import { type Product, ProductType } from '@unchainedshop/core-products';
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';
import { WarehousingDirector, DeliveryDirector, PaymentDirector } from '../directors/index.ts';
import { fullfillQuotationService } from './fullfillQuotation.ts';

const isAutoConfirmationEnabled = async (
  {
    orderPayment,
    orderDelivery,
  }: {
    orderPayment: OrderPayment;
    orderDelivery: OrderDelivery;
  },
  modules: Modules,
) => {
  if (orderPayment.status !== OrderPaymentStatus.PAID) {
    const paymentProvider = await modules.payment.paymentProviders.findProvider({
      paymentProviderId: orderPayment.paymentProviderId,
    });
    if (!paymentProvider)
      throw new Error('Payment provider not found: ' + orderPayment.paymentProviderId);
    const actions = await PaymentDirector.actions(paymentProvider, {}, { modules });
    if (!actions.isPayLaterAllowed()) return false;
  }

  if (orderDelivery.status !== OrderDeliveryStatus.DELIVERED) {
    const deliveryProvider = await modules.delivery.findProvider({
      deliveryProviderId: orderDelivery.deliveryProviderId,
    });
    if (!deliveryProvider)
      throw new Error('Delivery provider not found: ' + orderDelivery.deliveryProviderId);
    const director = await DeliveryDirector.actions(deliveryProvider, {}, { modules });
    if (!director.isAutoReleaseAllowed()) return false;
  }

  return true;
};

const findNextStatus = async (
  status: OrderStatus | null,
  order: Order,
  modules: Modules,
): Promise<OrderStatus | null> => {
  if (status === null) {
    return OrderStatus.PENDING;
  }

  if (status === OrderStatus.FULLFILLED || status === OrderStatus.REJECTED) {
    // Final!
    return status;
  }

  const orderPayment =
    order.paymentId &&
    (await modules.orders.payments.findOrderPayment({
      orderPaymentId: order.paymentId,
    }));
  if (!orderPayment) return status;

  const orderDelivery =
    order.deliveryId &&
    (await modules.orders.deliveries.findDelivery({
      orderDeliveryId: order.deliveryId,
    }));
  if (!orderDelivery) return status;

  // Ok, we have a payment and a delivery and the correct status,
  // let's check if we can auto-confirm or auto-fulfill
  if (status === OrderStatus.PENDING) {
    if (await isAutoConfirmationEnabled({ orderPayment, orderDelivery }, modules)) {
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

export async function processOrderService(
  this: Modules,
  initialOrder: Order,
  orderTransactionContext: {
    paymentContext?: any;
    deliveryContext?: any;
    comment?: string;
    nextStatus?: OrderStatus;
  },
) {
  const {
    paymentContext,
    deliveryContext,
    nextStatus: forceNextStatus,
    comment,
  } = orderTransactionContext;

  const orderId = initialOrder._id;
  let order = initialOrder;
  let nextStatus = forceNextStatus || (await findNextStatus(initialOrder.status, order, this));

  if (nextStatus === OrderStatus.PENDING) {
    // auto charge during transition to pending
    await PaymentDirector.chargeOrderPayment(
      order,
      { userId: order.userId, transactionContext: paymentContext },
      { modules: this },
    );
    nextStatus = await findNextStatus(nextStatus, order, this);
  }

  if (nextStatus === OrderStatus.REJECTED) {
    // auto cancel during transition to rejected
    await PaymentDirector.cancelOrderPayment(
      order,
      { userId: order.userId, transactionContext: paymentContext },
      { modules: this },
    );
  }

  if (nextStatus === OrderStatus.CONFIRMED) {
    // confirm pre-authorized payments
    await PaymentDirector.confirmOrderPayment(
      order,
      { userId: order.userId, transactionContext: paymentContext },
      { modules: this },
    );
    if (order.status !== OrderStatus.CONFIRMED) {
      // we have to stop here shortly to complete the confirmation
      // before auto delivery is started, else we have no chance to create
      // numbers that are needed for delivery
      order = (await this.orders.updateStatus(orderId, {
        status: OrderStatus.CONFIRMED,
        info: comment,
      })) as Order;

      // TODO: What happens if this THROWS?
      // Tokenization would be skipped?
      // Enrollments will not be there?
      // Quotations would not fulfil?
      await DeliveryDirector.sendOrderDelivery(order, deliveryContext, { modules: this });

      const orderPositions = await this.orders.positions.findOrderPositions({ orderId });
      const mappedProductOrderPositions = await Promise.all(
        orderPositions.map(async (orderPosition) => {
          const product = (await this.products.findProduct({
            productId: orderPosition.productId,
          })) as Product;
          return {
            orderPosition,
            product,
          };
        }),
      );
      const tokenizedItems = mappedProductOrderPositions.filter(
        (item) => item.product?.type === ProductType.TOKENIZED_PRODUCT,
      ) as { orderPosition: OrderPosition; product: Product }[];

      if (tokenizedItems.length > 0) {
        // Give virtual warehouse a chance to instantiate new virtual objects
        const virtualProviders = (await this.warehousing.allProviders()).filter(
          ({ type }) => type === WarehousingProviderType.VIRTUAL,
        );

        // It's very important to do this in a series and not in Promise.all
        // TODO: Actually, only createTokens should decide on the unique tokenSerialNumber
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
              { modules: this },
            );
            const isActive = await adapterActions.isActive();
            if (isActive) {
              const tokens = await adapterActions.tokenize();
              await this.warehousing.createTokens(tokens);
            }
          }
        }
      }

      // Enrollments: Generate enrollments for plan products
      const planItems = mappedProductOrderPositions.filter(
        (item) => item.product?.type === ProductType.PLAN_PRODUCT && !order.originEnrollmentId,
      );
      if (planItems.length > 0) {
        await createEnrollmentFromCheckoutService.bind(this)(order, {
          items: planItems,
          context: {
            paymentContext,
            deliveryContext,
          },
        });
      }

      // Quotations: If we came here, the checkout succeeded, so we can fullfill underlying quotations
      const quotationItems = mappedProductOrderPositions.filter(
        (item) => item.orderPosition.quotationId,
      ) as { orderPosition: OrderPosition & { quotationId: string }; product: Product }[];

      await Promise.all(
        quotationItems.map(async ({ orderPosition }) => {
          const quotation = await this.quotations.findQuotation({
            quotationId: orderPosition.quotationId,
          });
          if (!quotation) return; // TODO: What happens then?
          await fullfillQuotationService.bind(this)(quotation, {
            orderId,
            orderPositionId: orderPosition._id,
          });
        }),
      );
    }

    nextStatus = await findNextStatus(nextStatus, order, this);
  }

  return (await this.orders.updateStatus(order._id, { status: nextStatus, info: comment })) as Order;
}
