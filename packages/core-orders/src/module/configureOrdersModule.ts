import { Context } from '@unchainedshop/types/api';
import { ModuleInput, Update } from '@unchainedshop/types/common';
import { Order, OrdersModule } from '@unchainedshop/types/orders';
import { log } from 'meteor/unchained:logger';
import { dbIdToString, generateDbFilterById } from 'meteor/unchained:utils';
import { OrderDeliveriesCollection } from '../db/OrderDeliveriesCollection';
import { OrderDiscountsCollection } from '../db/OrderDiscountsCollection';
import { OrderDiscountTrigger } from '../db/OrderDiscountTrigger';
import { OrderPaymentsCollection } from '../db/OrderPaymentsCollection';
import { OrderPositionsCollection } from '../db/OrderPositionsCollection';
import { OrdersCollection } from '../db/OrdersCollection';
import { OrderStatus } from '../db/OrderStatus';
import { OrderDiscountDirector } from '../director/OrderDiscountDirector';
import { OrderPricingDirector } from '../director/OrderPricingDirector';
import { orderSettings } from '../orders-settings';
import { configureOrderDeliveriesModule } from './configureOrderDeliveriesModule';
import { configureOrderDiscountsModule } from './configureOrderDiscountsModule';
import { configureOrderPaymentsModule } from './configureOrderPaymentsModule';
import { configureOrderPositionsModule } from './configureOrderPositionsModule';
import { configureOrderModuleMutations } from './configureOrdersModule-mutations';
import { configureOrderModuleProcessing } from './configureOrdersModule-processing';
import { configureOrdersModuleQueries } from './configureOrdersModule-queries';
import { configureOrderModuleTransformations } from './configureOrdersModule-transformations';

export const configureOrdersModule = async ({
  db,
}: ModuleInput): Promise<OrdersModule> => {
  const Orders = await OrdersCollection(db);
  const OrderDeliveries = await OrderDeliveriesCollection(db);
  const OrderDiscounts = await OrderDiscountsCollection(db);
  const OrderPayments = await OrderPaymentsCollection(db);
  const OrderPositions = await OrderPositionsCollection(db);

  const findOrderPositions = async (order: Order) =>
    await OrderPositions.find({
      orderId: order._id,
      quantity: { $gt: 0 },
    }).toArray();

  const findOrderDelivery = async (order: Order) =>
    await OrderDeliveries.findOne(generateDbFilterById(order.deliveryId));

  const findOrderDiscounts = async (order: Order) =>
    await OrderDiscounts.findOne({ orderId: order._id });

  const findOrderPayment = async (order: Order) =>
    await OrderPayments.findOne(generateDbFilterById(order.paymentId));

  const findNewOrderNumber = async (order: Order) => {
    let orderNumber = null;
    let i = 0;
    while (!orderNumber) {
      const newHashID = orderSettings.orderNumberHashFn(order, i);
      if (
        (await Orders.find(
          { orderNumber: newHashID },
          { limit: 1 }
        ).count()) === 0
      ) {
        orderNumber = newHashID;
      }
      i += 1;
    }
    return orderNumber;
  };

  const updateStatus: OrdersModule['updateStatus'] = async (
    orderId,
    { status, info },
    requestContext
  ) => {
    const selector = generateDbFilterById(orderId);
    const order = await Orders.findOne(selector);

    if (order.status === status) return order;

    const date = new Date();
    const modifier: Update<Order> = {
      $set: { status, updated: new Date(), updatedBy: requestContext.userId },
      $push: {
        log: {
          date,
          status,
          info,
        },
      },
    };

    switch (status) {
      // explicitly use fallthrough here!
      case OrderStatus.FULLFILLED:
        if (!order.fullfilled) {
          /* @ts-ignore */
          modifier.$set.fullfilled = date;
        }
      case OrderStatus.CONFIRMED: // eslint-disable-line no-fallthrough
        if (!order.confirmed) {
          /* @ts-ignore */
          modifier.$set.confirmed = date;
        }
      case OrderStatus.PENDING: // eslint-disable-line no-fallthrough
        if (!order.ordered) {
          /* @ts-ignore */
          modifier.$set.ordered = date;
        }
        if (!order.orderNumber) {
          // Order Numbers can be set by the user
          /* @ts-ignore */
          modifier.$set.orderNumber = findNewOrderNumber(order);
        }
        break;
      default:
        break;
    }

    log(`New Status: ${status}`, { orderId });

    await Orders.updateOne(selector, modifier);

    return await Orders.findOne(selector);
  };

  const updateDiscounts = async (order: Order, requestContext: Context) => {
    const { modules } = requestContext;
    const orderId = dbIdToString(order._id);

    // 1. go through existing order-discounts and check if discount still valid,
    // those who are not valid anymore should get removed
    const discounts = await modules.orders.discounts.findOrderDiscounts({
      orderId: dbIdToString(order._id),
    });

    await Promise.all(
      discounts.map(async (discount) => {
        const isValid = await modules.orders.discounts.isValid(
          discount,
          requestContext
        );

        if (!isValid) {
          await modules.orders.discounts.delete(
            dbIdToString(discount._id),
            requestContext
          );
        }
      })
    );

    // 2. run auto-system discount
    const cleanedDiscounts = await modules.orders.discounts.findOrderDiscounts({
      orderId,
    });

    const currentDiscountKeys = cleanedDiscounts.map(
      ({ discountKey }) => discountKey
    );

    const director = OrderDiscountDirector.actions({ order }, requestContext);
    const systemDiscounts = await director.findSystemDiscounts();

    await Promise.all(
      systemDiscounts
        .filter((key) => currentDiscountKeys.indexOf(key) === -1)
        .map(
          async (discountKey) =>
            await modules.orders.discounts.create(
              {
                orderId,
                discountKey,
                trigger: OrderDiscountTrigger.SYSTEM,
              },
              requestContext.userId
            )
        )
    );
  };

  const initProviders = async (order: Order, requestContext: Context) => {
    const { modules } = requestContext;

    const orderId = dbIdToString(order._id);
    let updatedOrder = order;

    // Init delivery provider
    const supportedDeliveryProviders = await modules.delivery.findSupported(
      { order },
      requestContext
    );

    const orderDelivery = await modules.orders.deliveries.findDelivery({
      orderDeliveryId: order.deliveryId,
    });
    const deliveryProviderId = orderDelivery?.deliveryProviderId;

    let isAlreadyInitializedWithSupportedProvider =
      supportedDeliveryProviders.some((provider) => {
        return provider === deliveryProviderId;
      });

    if (
      supportedDeliveryProviders.length > 0 &&
      !isAlreadyInitializedWithSupportedProvider
    ) {
      updatedOrder = await modules.orders.setDeliveryProvider(
        orderId,
        supportedDeliveryProviders[0],
        requestContext
      );
    }

    // Init payment provider
    const supportedPaymentProviders =
      modules.payment.paymentProviders.findSupported({ order }, requestContext);

    const orderPayment = await modules.orders.payments.findOrderPayment({
      orderPaymentId: order.paymentId,
    });
    const paymentProviderId = orderPayment?.paymentProviderId;

    isAlreadyInitializedWithSupportedProvider = supportedPaymentProviders.some(
      (provider) => {
        return provider === paymentProviderId;
      }
    );
    if (
      supportedPaymentProviders.length > 0 &&
      !isAlreadyInitializedWithSupportedProvider
    ) {
      let isOrderUpdated = false;

      const paymentCredentials =
        await modules.payment.paymentCredentials.findPaymentCredentials(
          { userId: order.userId, isPreferred: true },
          {
            sort: {
              created: -1,
            },
          }
        );

      if (paymentCredentials?.length) {
        const foundSupportedPreferredProvider = supportedPaymentProviders.find(
          (supportedPaymentProvider) => {
            return paymentCredentials.some((paymentCredential) => {
              return (
                supportedPaymentProvider === paymentCredential.paymentProviderId
              );
            });
          }
        );

        if (foundSupportedPreferredProvider) {
          isOrderUpdated = true;
          await modules.orders.setPaymentProvider(
            orderId,
            foundSupportedPreferredProvider,
            requestContext
          );
        }

        updatedOrder = await modules.orders.setPaymentProvider(
          orderId,
          supportedPaymentProviders[0],
          requestContext
        );
      }
    }

    return updatedOrder;
  };

  const updateCalculation: OrdersModule['updateCalculation'] = async (
    orderId,
    requestContext
  ) => {
    const { modules } = requestContext;
    const selector = generateDbFilterById(orderId);
    const order = await Orders.findOne(selector);

    await updateDiscounts(order, requestContext);

    await initProviders(order, requestContext);

    const orderPositions = await findOrderPositions(order);
    const updatedOrderPositions = await Promise.all(
      orderPositions.map(
        async (orderPosition) =>
          await modules.orders.positions.updateCalculation(
            orderPosition,
            requestContext
          )
      )
    );

    const orderDelivery = await findOrderDelivery(order);
    await modules.orders.deliveries.updateCalculation(
      orderDelivery,
      requestContext
    );
    const orderPayment = await findOrderPayment(order);
    await modules.orders.payments.updateCalculation(
      orderPayment,
      requestContext
    );

    await Promise.all(
      updatedOrderPositions.map(
        async (orderPosition) =>
          await modules.orders.positions.updateScheduling(
            { order, orderDelivery, orderPosition },
            requestContext
          )
      )
    );

    const pricing = OrderPricingDirector.actions({ order }, requestContext);
    const calculation = await pricing.calculate();

    await Orders.updateOne(selector, {
      $set: {
        calculation,
        updated: new Date(),
        updatedBy: requestContext.userId,
      },
    });

    return await Orders.findOne(selector);
  };

  const orderQueries = configureOrdersModuleQueries({ Orders });
  const orderTransformations = configureOrderModuleTransformations({
    Orders,
  });
  const orderProcessing = configureOrderModuleProcessing({
    Orders,
    OrderDeliveries,
    OrderPayments,
    OrderPositions,
    updateStatus,
  });
  const orderMutations = configureOrderModuleMutations({
    Orders,
    OrderDeliveries,
    OrderDiscounts,
    OrderPayments,
    OrderPositions,
    updateStatus,
    updateCalculation,
  });

  const orderDiscountsModule = configureOrderDiscountsModule({
    OrderDiscounts,
    updateCalculation,
  });

  const orderPositionsModule = configureOrderPositionsModule({
    OrderPositions,
    updateCalculation,
  });

  const orderPaymentsModule = configureOrderPaymentsModule({
    OrderPayments,
    updateCalculation,
  });

  const orderDeliveriesModule = configureOrderDeliveriesModule({
    OrderDeliveries,
    updateCalculation,
  });

  return {
    ...orderQueries,
    ...orderTransformations,
    ...orderProcessing,
    ...orderMutations,

    // Subentities
    deliveries: orderDeliveriesModule,
    discounts: orderDiscountsModule,
    positions: orderPositionsModule,
    payments: orderPaymentsModule,
  };
};
