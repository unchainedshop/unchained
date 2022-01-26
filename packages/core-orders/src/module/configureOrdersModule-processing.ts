import { Context } from '@unchainedshop/types/api';
import { Collection } from '@unchainedshop/types/common';
import { Order, OrderProcessing, OrdersModule } from '@unchainedshop/types/orders';
import { OrderDelivery } from '@unchainedshop/types/orders.deliveries';
import { OrderPayment } from '@unchainedshop/types/orders.payments';
import { OrderPosition } from '@unchainedshop/types/orders.positions';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log } from 'meteor/unchained:logger';
import { generateDbFilterById } from 'meteor/unchained:utils';
import { OrderStatus } from '../db/OrderStatus';
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
    if (order.status !== null) errors.push(new Error('Order has already been checked out'));
    if (!order.contact) errors.push(new Error('Contact data not provided'));
    if (!order.billingAddress) errors.push(new Error('Billing address not provided'));

    const items = await findOrderPositions(order);
    const totalQuantity = items.reduce((oldValue, item) => oldValue + item.quantity, 0);
    if (totalQuantity === 0) errors.push(new Error('No items in cart'));
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

  const findNextStatus = async (order: Order, requestContext: Context): Promise<OrderStatus | null> => {
    let { status } = order;

    if (status === null /* OrderStatus.OPEN */ || !status) {
      if ((await missingInputDataForCheckout(order)).length === 0) {
        emit('ORDER_CHECKOUT', { order });
        status = OrderStatus.PENDING;
      }
    }

    if (status === OrderStatus.PENDING) {
      if (await isAutoConfirmationEnabled(order, requestContext)) {
        emit('ORDER_CONFIRMED', { order });
        status = OrderStatus.CONFIRMED;
      }
    }

    if (status === OrderStatus.CONFIRMED) {
      const isFullfilled = await isAutoFullfillmentEnabled(order, requestContext);
      if (isFullfilled) {
        emit('ORDER_FULLFILLED', { order });
        status = OrderStatus.FULLFILLED;
      }
    }

    return status;
  };

  return {
    checkout: async (order, params, requestContext) => {
      const { modules, localeContext } = requestContext;
      const orderId = order._id;

      const errors = [
        ...(await missingInputDataForCheckout(order)),
        ...(await itemValidationErrors(order, requestContext)),
      ].filter(Boolean);

      if (errors.length > 0) {
        throw new Error(errors[0]);
      }

      const user = await modules.users.findUser({ userId: order.userId });
      const locale = modules.users.userLocale(user, {
        localeContext,
      });

      // Process order checkout
      let updatedOrder = await modules.orders.updateContext(
        orderId,
        params.orderContext,
        requestContext,
      );

      updatedOrder = await modules.orders.processOrder(
        updatedOrder,
        {
          paymentContext: params.paymentContext,
          deliveryContext: params.deliveryContext,
        },
        requestContext,
      );
      updatedOrder = await modules.orders.sendOrderConfirmationToCustomer(
        updatedOrder,
        { locale },
        requestContext,
      );
      updatedOrder = await modules.orders.ensureCartForUser(
        {
          order: updatedOrder,
          user,
          countryContext: locale.country,
        },
        requestContext,
      );

      return updatedOrder;
    },

    confirm: async (order, params, requestContext) => {
      const { modules, localeContext } = requestContext;
      const orderId = order._id;

      if (order.status !== OrderStatus.PENDING) return order;

      const user = await modules.users.findUser({ userId: order.userId });
      const locale = modules.users.userLocale(user, {
        localeContext,
      });

      // Process order confirmation
      let updatedOrder = await modules.orders.updateContext(
        orderId,
        params.orderContext,
        requestContext,
      );
      updatedOrder = await modules.orders.updateStatus(
        orderId,
        { status: OrderStatus.CONFIRMED, info: 'confirmed manually' },
        requestContext,
      );
      updatedOrder = await modules.orders.processOrder(
        updatedOrder,
        {
          paymentContext: params.paymentContext,
          deliveryContext: params.deliveryContext,
        },
        requestContext,
      );
      updatedOrder = await modules.orders.sendOrderConfirmationToCustomer(
        updatedOrder,
        { locale },
        requestContext,
      );

      return updatedOrder;
    },

    ensureCartForUser: async (params, requestContext) => {
      const { modules, services, userId } = requestContext;

      if (!ordersSettings.ensureUserHasCart) return params.order;

      const user =
        params.user || (params.order && (await modules.users.findUser({ userId: params.order._id })));

      if (!user) throw new Error('User with the id not found');

      const countryCode = params.countryContext || user.lastLogin.countryContext;

      const cart = await modules.orders.cart({ countryContext: params.countryContext }, user);
      if (cart) return cart;

      const currency = await services.countries.resolveDefaultCurrencyCode(
        {
          isoCode: params.countryContext,
        },
        requestContext,
      );

      return modules.orders.create(
        {
          // TODO: Check with Pascal
          currency,
          countryCode,
          billingAddress: user.lastBillingAddress || user.profile?.address,
          contact:
            user.lastContact ||
            (!user.guest
              ? {
                  telNumber: user.profile?.phoneMobile,
                  emailAddress: modules.users.primaryEmail(user)?.address,
                }
              : {}),
        },
        userId,
      );
    },

    migrateCart: async ({ fromCart, shouldMergeCarts, toCart }, requestContext) => {
      const fromCartId = fromCart._id;
      const toCartId = toCart._id;

      if (!toCart || !shouldMergeCarts) {
        // No destination cart, move whole cart
        await Orders.updateOne(generateDbFilterById(fromCart._id), {
          $set: {
            userId: toCart.userId,
          },
        });
        return updateCalculation(fromCartId, requestContext);
      }

      // Move positions
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
      const { modules, userId } = requestContext;

      const orderId = initialOrder._id;
      let order = initialOrder;
      let nextStatus = await findNextStatus(order, requestContext);

      if (nextStatus === OrderStatus.PENDING) {
        // auto charge during transition to pending
        const orderPayment = await modules.orders.payments.findOrderPayment({
          orderPaymentId: order.paymentId,
        });

        await modules.orders.payments.charge(
          orderPayment,
          { order, transactionContext: params.paymentContext },
          requestContext,
        );
        await modules.users.updateLastBillingAddress(order.userId, order.billingAddress, userId);
        await modules.users.updateLastContact(order.userId, order.contact, userId);
      }

      order = await modules.orders.findOrder({ orderId });
      nextStatus = await findNextStatus(order, requestContext);
      if (nextStatus === OrderStatus.CONFIRMED) {
        const orderDelivery = await modules.orders.deliveries.findDelivery({
          orderDeliveryId: order.deliveryId,
        });
        if (order.status !== OrderStatus.CONFIRMED) {
          // we have to stop here shortly to complete the confirmation
          // before auto delivery is started, else we have no chance to create
          // documents and numbers that are needed for delivery
          const order = await updateStatus(
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
              deliveryContext: params.deliveryContext,
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
                    paymentContext: params.paymentContext,
                    deliveryContext: params.deliveryContext,
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
              deliveryContext: params.deliveryContext,
            },
            requestContext,
          );
        }

        // Reserve items
        // If we came here, the checkout succeeded, so we can reserve the items
        const orderPositions = await findOrderPositions(order);
        await Promise.all(
          orderPositions.map(async (orderPosition) => {
            const quotation = await modules.quotations.fullfillQuotation(
              orderPosition.quotationId,
              {
                orderId,
                orderPositionId: orderPosition._id,
              },
              requestContext,
            );

            log(`OrderPosition ${orderPosition._id} -> Reserve ${orderPosition.quantity}`, {
              orderId,
              quotation,
            });
          }),
        );

        nextStatus = await findNextStatus(order, requestContext);

        // TODO: we will use this function to keep a "Ordered in Flight" amount, allowing us to
        // do live stock stuff
        // 2. Reserve quantity at Warehousing Provider until order is CANCELLED/FULLFILLED
        // ???
      }

      return updateStatus(order._id, { status: nextStatus, info: 'order processed' }, requestContext);
    },

    sendOrderConfirmationToCustomer: async (order, params, requestContext) => {
      await requestContext.modules.worker.addWork(
        {
          type: 'MESSAGE',
          retries: 0,
          input: {
            locale: params.locale,
            template: 'ORDER_CONFIRMATION',
            orderId: order._id,
          },
        },
        requestContext.userId,
      );

      return order;
    },
  };
};
