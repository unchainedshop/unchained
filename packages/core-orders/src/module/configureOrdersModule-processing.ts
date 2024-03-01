import { mongodb, generateDbFilterById } from '@unchainedshop/mongodb';
import { Order, OrderStatus, OrderProcessing, OrdersModule } from '@unchainedshop/types/orders.js';
import { OrderDelivery } from '@unchainedshop/types/orders.deliveries.js';
import { OrderPayment } from '@unchainedshop/types/orders.payments.js';
import { OrderPosition } from '@unchainedshop/types/orders.positions.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { log } from '@unchainedshop/logger';
import { ProductType } from '@unchainedshop/types/products.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { ordersSettings } from '../orders-settings.js';

const ORDER_PROCESSING_EVENTS: string[] = [
  'ORDER_CHECKOUT',
  'ORDER_CONFIRMED',
  'ORDER_REJECTED',
  'ORDER_FULLFILLED',
];

export const configureOrderModuleProcessing = ({
  Orders,
  OrderPositions,
  OrderDeliveries,
  OrderPayments,
}: {
  Orders: mongodb.Collection<Order>;
  OrderPositions: mongodb.Collection<OrderPosition>;
  OrderDeliveries: mongodb.Collection<OrderDelivery>;
  OrderPayments: mongodb.Collection<OrderPayment>;
}): OrderProcessing => {
  registerEvents(ORDER_PROCESSING_EVENTS);

  const findNewOrderNumber = async (order: Order, index = 0) => {
    const newHashID = ordersSettings.orderNumberHashFn(order, index);
    if ((await Orders.countDocuments({ orderNumber: newHashID }, { limit: 1 })) === 0) {
      return newHashID;
    }
    return findNewOrderNumber(order, index + 1);
  };

  const updateStatus: OrdersModule['updateStatus'] = async (orderId, { status, info }) => {
    const selector = generateDbFilterById(orderId);
    const order = await Orders.findOne(selector, {});

    if (order.status === status) return order;

    const date = new Date();
    const $set: Partial<Order> = {
      status,
      updated: new Date(),
    };
    switch (status) {
      // explicitly use fallthrough here!
      case OrderStatus.FULLFILLED:
        $set.fullfilled = order.fullfilled || date;
      case OrderStatus.REJECTED: // eslint-disable-line no-fallthrough
        $set.rejected = order.rejected || date;
      case OrderStatus.CONFIRMED: // eslint-disable-line no-fallthrough
        $set.confirmed = order.confirmed || date;
      case OrderStatus.PENDING: // eslint-disable-line no-fallthrough
        $set.ordered = order.ordered || date;
        $set.orderNumber = order.orderNumber || (await findNewOrderNumber(order));
        break;
      default:
        break;
    }

    const modifier: mongodb.UpdateFilter<Order> = {
      $set,
      $push: {
        log: {
          date,
          status,
          info,
        },
      },
    };

    const modificationResult = await Orders.findOneAndUpdate(
      {
        ...selector,
        status: { $ne: status }, // Only update if status is different
      },
      modifier,
      {
        returnDocument: 'after',
        includeResultMetadata: true,
      },
    );

    if (modificationResult.ok) {
      log(`New Status: ${status}`, { orderId });
      if (order.status === null) {
        // The first time that an order transitions away from cart is a checkout event
        await emit('ORDER_CHECKOUT', { order: modificationResult.value, oldStatus: order.status });
      }
      switch (status) {
        case OrderStatus.FULLFILLED:
          await emit('ORDER_FULLFILLED', { order: modificationResult.value, oldStatus: order.status });
          break;
        case OrderStatus.REJECTED:
          await emit('ORDER_REJECTED', { order: modificationResult.value, oldStatus: order.status });
          break;
        case OrderStatus.CONFIRMED:
          await emit('ORDER_CONFIRMED', { order: modificationResult.value, oldStatus: order.status });
          break;
        default:
          break;
      }
    }

    return modificationResult.value || Orders.findOne(selector, {});
  };

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

  const itemValidationErrors = async (order: Order, unchainedAPI: UnchainedCore) => {
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

        const product = await unchainedAPI.modules.products.findProduct({
          productId: orderPosition.productId,
        });

        try {
          await ordersSettings.validateOrderPosition(
            {
              order,
              product,
              configuration: orderPosition.configuration,
              quantityDiff: 0,
            },
            unchainedAPI,
          );
        } catch (e) {
          errors.push(e);
        }

        const quotation =
          orderPosition.quotationId &&
          (await unchainedAPI.modules.quotations.findQuotation({
            quotationId: orderPosition.quotationId,
          }));
        if (quotation && !unchainedAPI.modules.quotations.isProposalValid(quotation)) {
          errors.push(new Error('Quotation expired or fullfiled, please request a new offer'));
        }
        return errors;
      }),
    );

    return validationErrors.flatMap((f) => f);
  };

  const isAutoConfirmationEnabled = async (order: Order, unchainedAPI: UnchainedCore) => {
    const { modules } = unchainedAPI;

    if (order.status === OrderStatus.FULLFILLED || order.status === OrderStatus.CONFIRMED) {
      return false;
    }

    const orderPayment = await findOrderPayment(order);
    let isBlockingOrderConfirmation =
      orderPayment &&
      (await modules.orders.payments.isBlockingOrderConfirmation(orderPayment, unchainedAPI));
    if (isBlockingOrderConfirmation) return false;

    const orderDelivery = await findOrderDelivery(order);
    isBlockingOrderConfirmation =
      orderDelivery &&
      (await modules.orders.deliveries.isBlockingOrderConfirmation(orderDelivery, unchainedAPI));
    if (isBlockingOrderConfirmation) return false;

    return true;
  };

  const isAutoFullfillmentEnabled = async (order: Order, unchainedAPI: UnchainedCore) => {
    const { modules } = unchainedAPI;

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
    unchainedAPI: UnchainedCore,
  ): Promise<OrderStatus | null> => {
    if (status === null) {
      return OrderStatus.PENDING;
    }

    if (status === OrderStatus.PENDING) {
      if (await isAutoConfirmationEnabled(order, unchainedAPI)) {
        return OrderStatus.CONFIRMED;
      }
    }

    if (status === OrderStatus.CONFIRMED) {
      if (await isAutoFullfillmentEnabled(order, unchainedAPI)) {
        return OrderStatus.FULLFILLED;
      }
    }

    return status;
  };

  return {
    checkout: async (orderId, { orderContext, paymentContext, deliveryContext }, unchainedAPI) => {
      const { modules } = unchainedAPI;

      await modules.orders.updateContext(orderId, orderContext, unchainedAPI);
      let order = await modules.orders.findOrder({ orderId });

      if (order.status !== null) return order;

      const errors = [
        ...(await missingInputDataForCheckout(order)),
        ...(await itemValidationErrors(order, unchainedAPI)),
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
        unchainedAPI,
      );

      // After checkout, store last checkout information on user
      await modules.users.updateLastBillingAddress(order.userId, order.billingAddress);
      await modules.users.updateLastContact(order.userId, order.contact);

      // Then ensure new cart is created before we return from checkout
      const user = await modules.users.findUserById(order.userId);
      const locale = modules.users.userLocale(user);
      await modules.orders.ensureCartForUser(
        {
          user,
          countryCode: locale.country,
        },
        unchainedAPI,
      );

      return order;
    },

    confirm: async (orderId, { orderContext, paymentContext, deliveryContext }, unchainedAPI) => {
      const { modules } = unchainedAPI;

      await modules.orders.updateContext(orderId, orderContext, unchainedAPI);
      const order = await modules.orders.findOrder({ orderId });

      if (order.status !== OrderStatus.PENDING) return order;

      return modules.orders.processOrder(
        order,
        {
          paymentContext,
          deliveryContext,
          nextStatus: OrderStatus.CONFIRMED,
        },
        unchainedAPI,
      );
    },

    reject: async (orderId, { orderContext, paymentContext, deliveryContext }, unchainedAPI) => {
      const { modules } = unchainedAPI;

      await modules.orders.updateContext(orderId, orderContext, unchainedAPI);
      const order = await modules.orders.findOrder({ orderId });

      if (order.status !== OrderStatus.PENDING) return order;

      return modules.orders.processOrder(
        order,
        {
          paymentContext,
          deliveryContext,
          nextStatus: OrderStatus.REJECTED,
        },
        unchainedAPI,
      );
    },

    ensureCartForUser: async ({ user, countryCode }, unchainedAPI) => {
      const { modules, services } = unchainedAPI;

      if (!ordersSettings.ensureUserHasCart) return null;

      const cart = await modules.orders.cart({ countryContext: countryCode }, user);
      if (cart) return cart;

      return services.orders.createUserCart(
        {
          user,
          countryCode,
        },
        unchainedAPI,
      );
    },

    processOrder: async (initialOrder, params, unchainedAPI) => {
      const { modules } = unchainedAPI;
      const { paymentContext, deliveryContext, nextStatus: forceNextStatus } = params;

      const orderId = initialOrder._id;
      let order = initialOrder;
      let nextStatus =
        forceNextStatus || (await findNextStatus(initialOrder.status, order, unchainedAPI));

      if (nextStatus === OrderStatus.PENDING) {
        // auto charge during transition to pending
        const orderPayment = await modules.orders.payments.findOrderPayment({
          orderPaymentId: order.paymentId,
        });

        await modules.orders.payments.charge(
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
        await modules.orders.payments.cancel(
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
        await modules.orders.payments.confirm(
          orderPayment,
          { userId: order.userId, transactionContext: paymentContext },
          unchainedAPI,
        );
        if (order.status !== OrderStatus.CONFIRMED) {
          // we have to stop here shortly to complete the confirmation
          // before auto delivery is started, else we have no chance to create
          // numbers that are needed for delivery
          order = await updateStatus(orderId, {
            status: OrderStatus.CONFIRMED,
            info: 'before delivery',
          });

          const orderDelivery = await modules.orders.deliveries.findDelivery({
            orderDeliveryId: order.deliveryId,
          });
          await modules.orders.deliveries.send(
            orderDelivery,
            {
              order,
              deliveryContext,
            },
            unchainedAPI,
          );

          const orderPositions = await findOrderPositions(order);
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
            (item) => item.product?.type === ProductType.TokenizedProduct,
          );
          if (tokenizedItems.length > 0) {
            // Give virtual warehouse a chance to instantiate new virtual objects
            await modules.warehousing.tokenizeItems(
              order,
              {
                items: tokenizedItems,
              },
              unchainedAPI,
            );
          }

          // Enrollments: Generate enrollments for plan products
          const planItems = mappedProductOrderPositions.filter(
            (item) => item.product?.type === ProductType.PlanProduct && !order.originEnrollmentId,
          );
          if (planItems.length > 0) {
            await modules.enrollments.createFromCheckout(
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
              await modules.quotations.fullfillQuotation(
                orderPosition.quotationId,
                {
                  orderId,
                  orderPositionId: orderPosition._id,
                },
                unchainedAPI,
              );
            }),
          );

          // TODO: we will use this function to keep a "Ordered in Flight" amount, allowing us to
          // do live stock stuff
          // 2. Reserve quantity at Warehousing Provider until order is CANCELLED/FULLFILLED
          // ???
        }

        nextStatus = await findNextStatus(nextStatus, order, unchainedAPI);
      }

      return updateStatus(order._id, { status: nextStatus, info: 'order processed' });
    },

    updateStatus,
  };
};
