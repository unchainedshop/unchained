import { Context } from '@unchainedshop/types/api';
import { Collection } from '@unchainedshop/types/common';
import { Order, OrderStatus, OrderProcessing, OrdersModule } from '@unchainedshop/types/orders';
import { OrderDelivery } from '@unchainedshop/types/orders.deliveries';
import { OrderPayment } from '@unchainedshop/types/orders.payments';
import { OrderPosition } from '@unchainedshop/types/orders.positions';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log } from 'meteor/unchained:logger';
import { generateDbFilterById } from 'meteor/unchained:utils';
import { ordersSettings } from '../orders-settings';

const ORDER_PROCESSING_EVENTS: string[] = ['ORDER_CHECKOUT', 'ORDER_CONFIRMED', 'ORDER_FULLFILLED'];

export const configureOrderModuleProcessing = ({
  Orders,
  OrderPositions,
  OrderDeliveries,
  OrderPayments,
  updateCalculation,
  updateStatus,
}: {
  Orders: Collection<Order>;
  OrderPositions: Collection<OrderPosition>;
  OrderDeliveries: Collection<OrderDelivery>;
  OrderPayments: Collection<OrderPayment>;
  updateCalculation: OrdersModule['updateCalculation'];
  updateStatus: OrdersModule['updateStatus'];
}): OrderProcessing => {
  registerEvents(ORDER_PROCESSING_EVENTS);

  const findOrderPositions = async (order: Order) =>
    OrderPositions.find({
      orderId: order._id,
      quantity: { $gt: 0 },
    }).toArray();

  const findOrderDelivery = async (order: Order) =>
    OrderDeliveries.findOne(generateDbFilterById(order.deliveryId), {});

  const findOrderPayment = async (order: Order) =>
    OrderPayments.findOne(generateDbFilterById(order.paymentId), {});

  const missingInputDataForCheckout = async (order: Order) => {
    const errors = [];
    if (!order.contact) errors.push(new Error('Contact data not provided'));
    if (!order.billingAddress) errors.push(new Error('Billing address not provided'));
    if (!(await findOrderDelivery(order))) errors.push('No delivery provider selected');
    if (!(await findOrderPayment(order))) errors.push('No payment provider selected');
    return errors;
  };

  const itemValidationErrors = async (order: Order, { modules }: Context) => {
    // Check if items are valid
    const orderPositions = await findOrderPositions(order);
    if (orderPositions.length === 0) {
      const NoItemsError = new Error('No items to checkout');
      NoItemsError.name = 'NoItemsError';
      return [NoItemsError];
    }
    const validationErrors = await Promise.all(
      orderPositions.map(async (orderPosition) => {
        const errors = [];

        log(`OrderPosition ${orderPosition._id} -> Validate ${orderPosition.quantity}`, {
          orderId: orderPosition.orderId,
        });

        const product = await modules.products.findProduct({
          productId: orderPosition.productId,
        });

        if (!modules.products.isActive(product)) {
          errors.push(new Error('This product is not available anymore'));
        }

        const quotation =
          orderPosition.quotationId &&
          (await modules.quotations.findQuotation({
            quotationId: orderPosition.quotationId,
          }));
        if (quotation && !modules.quotations.isProposalValid(quotation)) {
          errors.push(new Error('Quotation expired or fullfiled, please request a new offer'));
        }
        return errors;
      }),
    );

    return validationErrors.flatMap((f) => f);
  };

  const isAutoConfirmationEnabled = async (order: Order, requestContext: Context) => {
    const { modules } = requestContext;

    const orderPayment = await findOrderPayment(order);
    let isBlockingOrderConfirmation =
      orderPayment &&
      (await modules.orders.payments.isBlockingOrderConfirmation(orderPayment, requestContext));

    if (isBlockingOrderConfirmation) return false;

    const orderDelivery = await findOrderDelivery(order);
    isBlockingOrderConfirmation =
      orderDelivery &&
      (await modules.orders.deliveries.isBlockingOrderConfirmation(orderDelivery, requestContext));

    if (isBlockingOrderConfirmation) return false;

    if (order.status === OrderStatus.FULLFILLED || order.status === OrderStatus.CONFIRMED) {
      return false;
    }

    return true;
  };

  const isAutoFullfillmentEnabled = async (order: Order, requestContext: Context) => {
    const { modules } = requestContext;

    const orderPayment = await findOrderPayment(order);
    let isBlockingOrderFullfillment =
      orderPayment && modules.orders.payments.isBlockingOrderFullfillment(orderPayment);

    if (isBlockingOrderFullfillment) return false;

    const orderDelivery = await findOrderDelivery(order);
    isBlockingOrderFullfillment =
      orderDelivery && modules.orders.deliveries.isBlockingOrderFullfillment(orderDelivery);

    if (isBlockingOrderFullfillment) return false;

    if (order.status === OrderStatus.FULLFILLED) {
      return false;
    }

    return true;
  };

  const findNextStatus = async (
    status: OrderStatus | null,
    order: Order,
    requestContext: Context,
  ): Promise<OrderStatus> => {
    if (status === null) {
      if ((await missingInputDataForCheckout(order)).length === 0) {
        emit('ORDER_CHECKOUT', { order });
        return OrderStatus.PENDING;
      }
    }

    if (status === OrderStatus.PENDING) {
      if (await isAutoConfirmationEnabled(order, requestContext)) {
        emit('ORDER_CONFIRMED', { order });
        return OrderStatus.CONFIRMED;
      }
    }

    if (status === OrderStatus.CONFIRMED) {
      const isFullfilled = await isAutoFullfillmentEnabled(order, requestContext);
      if (isFullfilled) {
        emit('ORDER_FULLFILLED', { order });
        return OrderStatus.FULLFILLED;
      }
    }

    return status;
  };

  return {
    checkout: async (orderId, { orderContext, paymentContext, deliveryContext }, requestContext) => {
      const { modules, localeContext, userId } = requestContext;

      await modules.orders.updateContext(orderId, orderContext, requestContext);
      let order = await modules.orders.findOrder({ orderId });

      if (order.status !== null) return order;

      const errors = [
        ...(await missingInputDataForCheckout(order)),
        ...(await itemValidationErrors(order, requestContext)),
      ].filter(Boolean);

      if (errors.length > 0) {
        throw new Error(errors[0]);
      }

      // Process order
      order = await modules.orders.processOrder(
        order,
        {
          paymentContext,
          deliveryContext,
        },
        requestContext,
      );

      // After checkout, store last checkout information on user
      await modules.users.updateLastBillingAddress(order.userId, order.billingAddress, userId);
      await modules.users.updateLastContact(order.userId, order.contact, userId);

      // Then ensure new cart is created before we return from checkout
      const user = await modules.users.findUserById(order.userId);
      const locale = modules.users.userLocale(user, {
        localeContext,
      });
      await modules.orders.ensureCartForUser(
        {
          user,
          countryCode: locale.country,
        },
        requestContext,
      );

      return order;
    },

    confirm: async (orderId, { orderContext, paymentContext, deliveryContext }, requestContext) => {
      const { modules } = requestContext;

      await modules.orders.updateContext(orderId, orderContext, requestContext);
      const order = await modules.orders.findOrder({ orderId });

      if (order.status !== OrderStatus.PENDING) return order;

      return modules.orders.processOrder(
        order,
        {
          paymentContext,
          deliveryContext,
          nextStatus: OrderStatus.CONFIRMED,
        },
        requestContext,
      );
    },

    reject: async (orderId, { orderContext, paymentContext, deliveryContext }, requestContext) => {
      const { modules } = requestContext;

      await modules.orders.updateContext(orderId, orderContext, requestContext);
      const order = await modules.orders.findOrder({ orderId });

      if (order.status !== OrderStatus.PENDING) return order;

      return modules.orders.processOrder(
        order,
        {
          paymentContext,
          deliveryContext,
          nextStatus: OrderStatus.REJECTED,
        },
        requestContext,
      );
    },

    ensureCartForUser: async ({ user, countryCode }, requestContext) => {
      const { modules, services } = requestContext;

      if (!ordersSettings.ensureUserHasCart) return null;

      const cart = await modules.orders.cart({ countryContext: countryCode }, user);
      if (cart) return cart;

      return services.orders.createUserCart(
        {
          user,
          countryCode,
        },
        requestContext,
      );
    },

    migrateCart: async ({ fromCart, shouldMerge, toCart }, requestContext) => {
      const fromCartId = fromCart._id;

      if (!toCart || !shouldMerge) {
        // No destination cart, move whole cart
        await Orders.updateOne(generateDbFilterById(fromCart._id), {
          $set: {
            userId: requestContext.userId,
          },
        });
        return updateCalculation(fromCartId, requestContext);
      }

      // Move positions
      const toCartId = toCart._id;
      await OrderPositions.updateMany(
        { orderId: fromCartId },
        {
          $set: {
            orderId: toCartId,
          },
        },
      );

      await updateCalculation(fromCartId, requestContext);
      return updateCalculation(toCartId, requestContext);
    },

    processOrder: async (initialOrder, params, requestContext) => {
      const { modules } = requestContext;
      const { paymentContext, deliveryContext, nextStatus: forceNextStatus } = params;

      const orderId = initialOrder._id;
      let order = initialOrder;
      let nextStatus =
        forceNextStatus || (await findNextStatus(initialOrder.status, order, requestContext));

      if (nextStatus === OrderStatus.PENDING) {
        // auto charge during transition to pending
        const orderPayment = await modules.orders.payments.findOrderPayment({
          orderPaymentId: order.paymentId,
        });

        await modules.orders.payments.charge(
          orderPayment,
          { transactionContext: paymentContext },
          requestContext,
        );
        nextStatus = await findNextStatus(nextStatus, order, requestContext);
      }

      if (nextStatus === OrderStatus.REJECTED) {
        // auto cancel during transition to rejected
        const orderPayment = await modules.orders.payments.findOrderPayment({
          orderPaymentId: order.paymentId,
        });
        await modules.orders.payments.cancel(
          orderPayment,
          { transactionContext: paymentContext },
          requestContext,
        );
        nextStatus = await findNextStatus(nextStatus, order, requestContext);
      }

      if (nextStatus === OrderStatus.CONFIRMED) {
        // confirm pre-authorized payments
        const orderPayment = await modules.orders.payments.findOrderPayment({
          orderPaymentId: order.paymentId,
        });
        await modules.orders.payments.confirm(
          orderPayment,
          { transactionContext: paymentContext },
          requestContext,
        );

        const orderDelivery = await modules.orders.deliveries.findDelivery({
          orderDeliveryId: order.deliveryId,
        });
        if (order.status !== OrderStatus.CONFIRMED) {
          // we have to stop here shortly to complete the confirmation
          // before auto delivery is started, else we have no chance to create
          // documents and numbers that are needed for delivery
          order = await updateStatus(
            orderId,
            {
              status: OrderStatus.CONFIRMED,
              info: 'before delivery',
            },
            requestContext,
          );

          await modules.orders.deliveries.send(
            orderDelivery,
            {
              order,
              deliveryContext,
            },
            requestContext,
          );

          // Generate enrollments
          if (!order.originEnrollmentId) {
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

            const filteredProductOrderPositions = mappedProductOrderPositions.filter(
              (item) => item.product?.plan,
            );

            if (filteredProductOrderPositions.length > 0) {
              await modules.enrollments.createFromCheckout(
                order,
                {
                  items: filteredProductOrderPositions,
                  context: {
                    paymentContext,
                    deliveryContext,
                  },
                },
                requestContext,
              );
            }
          }
        } else {
          await modules.orders.deliveries.send(
            orderDelivery,
            {
              order,
              deliveryContext,
            },
            requestContext,
          );
        }

        // Reserve items
        // If we came here, the checkout succeeded, so we can reserve the items
        const orderPositions = await findOrderPositions(order);
        await Promise.all(
          orderPositions.map(async (orderPosition) => {
            if (orderPosition.quotationId) {
              await modules.quotations.fullfillQuotation(
                orderPosition.quotationId,
                {
                  orderId,
                  orderPositionId: orderPosition._id,
                },
                requestContext,
              );
            }

            log(`OrderPosition ${orderPosition._id} -> Reserve ${orderPosition.quantity}`, {
              orderId,
            });
          }),
        );

        nextStatus = await findNextStatus(nextStatus, order, requestContext);

        // TODO: we will use this function to keep a "Ordered in Flight" amount, allowing us to
        // do live stock stuff
        // 2. Reserve quantity at Warehousing Provider until order is CANCELLED/FULLFILLED
        // ???
      }

      order = await updateStatus(
        order._id,
        { status: nextStatus, info: 'order processed' },
        requestContext,
      );

      if (initialOrder.status !== order.status) {
        if (order.status === OrderStatus.REJECTED) {
          await modules.orders.sendOrderRejectionToCustomer(order, params, requestContext);
        } else {
          await modules.orders.sendOrderConfirmationToCustomer(order, params, requestContext);
        }
      }

      return order;
    },

    sendOrderConfirmationToCustomer: async (order, params, { modules, localeContext, userId }) => {
      const user = await modules.users.findUserById(order.userId);
      const locale = modules.users.userLocale(user, {
        localeContext,
      });
      await modules.worker.addWork(
        {
          type: 'MESSAGE',
          retries: 0,
          input: {
            ...params,
            locale,
            template: 'ORDER_CONFIRMATION',
            orderId: order._id,
          },
        },
        userId,
      );

      return order;
    },

    sendOrderRejectionToCustomer: async (order, params, { modules, localeContext, userId }) => {
      const user = await modules.users.findUserById(order.userId);
      const locale = modules.users.userLocale(user, {
        localeContext,
      });
      await modules.worker.addWork(
        {
          type: 'MESSAGE',
          retries: 0,
          input: {
            ...params,
            locale,
            template: 'ORDER_REJECTION',
            orderId: order._id,
          },
        },
        userId,
      );

      return order;
    },
  };
};
