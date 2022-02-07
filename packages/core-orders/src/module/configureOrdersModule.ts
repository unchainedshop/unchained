import { Context } from '@unchainedshop/types/api';
import { ModuleInput, Update } from '@unchainedshop/types/common';
import { Order, OrdersModule, OrdersSettingsOptions } from '@unchainedshop/types/orders';
import { log } from 'meteor/unchained:logger';
import { generateDbFilterById } from 'meteor/unchained:utils';
import { OrderDeliveriesCollection } from '../db/OrderDeliveriesCollection';
import { OrderDiscountsCollection } from '../db/OrderDiscountsCollection';
import { OrderDiscountTrigger } from '../db/OrderDiscountTrigger';
import { OrderPaymentsCollection } from '../db/OrderPaymentsCollection';
import { OrderPositionsCollection } from '../db/OrderPositionsCollection';
import { OrdersCollection } from '../db/OrdersCollection';
import { OrderStatus } from '../db/OrderStatus';
import { OrderDiscountDirector } from '../director/OrderDiscountDirector';
import { OrderPricingDirector } from '../director/OrderPricingDirector';
import { ordersSettings } from '../orders-settings';
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
  options: orderOptions,
}: ModuleInput<OrdersSettingsOptions>): Promise<OrdersModule> => {
  ordersSettings.configureSettings(orderOptions);

  const Orders = await OrdersCollection(db);
  const OrderDeliveries = await OrderDeliveriesCollection(db);
  const OrderDiscounts = await OrderDiscountsCollection(db);
  const OrderPayments = await OrderPaymentsCollection(db);
  const OrderPositions = await OrderPositionsCollection(db);

  const findOrderPositions = async (order: Order) =>
    OrderPositions.find({
      orderId: order._id,
      quantity: { $gt: 0 },
    }).toArray();

  const findOrderDelivery = async (order: Order) =>
    OrderDeliveries.findOne(generateDbFilterById(order.deliveryId), {});

  const findOrderPayment = async (order: Order) =>
    OrderPayments.findOne(generateDbFilterById(order.paymentId), {});

  const findNewOrderNumber = async (order: Order, index = 0) => {
    const newHashID = ordersSettings.orderNumberHashFn(order, index);
    if ((await Orders.find({ orderNumber: newHashID }, { limit: 1 }).count()) === 0) {
      return newHashID;
    }
    return findNewOrderNumber(order, index + 1);
  };

  const updateStatus: OrdersModule['updateStatus'] = async (
    orderId,
    { status, info },
    requestContext,
  ) => {
    const selector = generateDbFilterById(orderId);
    const order = await Orders.findOne(selector, {});

    if (order.status === status) return order;

    const date = new Date();
    const $set: Partial<Order> = {
      status,
      updated: new Date(),
      updatedBy: requestContext.userId,
    };

    switch (status) {
      // explicitly use fallthrough here!
      case OrderStatus.FULLFILLED:
        if (!order.fullfilled) {
          $set.fullfilled = date;
        }
      case OrderStatus.CONFIRMED: // eslint-disable-line no-fallthrough
        if (!order.confirmed) {
          $set.confirmed = date;
        }
      case OrderStatus.PENDING: // eslint-disable-line no-fallthrough
        if (!order.ordered) {
          $set.ordered = date;
        }
        if (!order.orderNumber) {
          // Order Numbers can be set by the user
          $set.orderNumber = await findNewOrderNumber(order);
        }
        break;
      default:
        break;
    }

    const modifier: Update<Order> = {
      $set,
      $push: {
        log: {
          date,
          status,
          info,
        },
      },
    };

    log(`New Status: ${status}`, { orderId });

    await Orders.updateOne(selector, modifier);

    return Orders.findOne(selector, {});
  };

  const updateDiscounts = async (orderId: string, requestContext: Context) => {
    const { modules } = requestContext;
    const selector = generateDbFilterById(orderId);
    const order = await Orders.findOne(selector, {});

    // 1. go through existing order-discounts and check if discount still valid,
    // those who are not valid anymore should get removed
    const discounts = await modules.orders.discounts.findOrderDiscounts({
      orderId,
    });

    await Promise.all(
      discounts.map(async (discount) => {
        const isValid = await modules.orders.discounts.isValid(discount, requestContext);

        if (!isValid) {
          await modules.orders.discounts.delete(discount._id, requestContext);
        }
      }),
    );

    // 2. run auto-system discount
    const cleanedDiscounts = await modules.orders.discounts.findOrderDiscounts({
      orderId,
    });

    const currentDiscountKeys = cleanedDiscounts.map(({ discountKey }) => discountKey);

    const director = OrderDiscountDirector.actions({ order }, requestContext);
    const systemDiscounts = await director.findSystemDiscounts();

    await Promise.all(
      systemDiscounts
        .filter((key) => currentDiscountKeys.indexOf(key) === -1)
        .map((discountKey) =>
          modules.orders.discounts.create(
            {
              orderId,
              discountKey,
              trigger: OrderDiscountTrigger.SYSTEM,
            },
            requestContext.userId,
          ),
        ),
    );
  };

  const initProviders = async (orderId: string, requestContext: Context) => {
    const { modules } = requestContext;

    const selector = generateDbFilterById(orderId);
    let updatedOrder = await Orders.findOne(selector, {});

    // Init delivery provider
    const supportedDeliveryProviders = await modules.delivery.findSupported(
      { order: updatedOrder },
      requestContext,
    );

    const orderDelivery = await modules.orders.deliveries.findDelivery({
      orderDeliveryId: updatedOrder.deliveryId,
    });
    const deliveryProviderId = orderDelivery?.deliveryProviderId;

    const isAlreadyInitializedWithSupportedDeliveryProvider = supportedDeliveryProviders.some(
      (provider) => {
        return provider._id === deliveryProviderId;
      },
    );

    if (supportedDeliveryProviders.length > 0 && !isAlreadyInitializedWithSupportedDeliveryProvider) {
      updatedOrder = await modules.orders.setDeliveryProvider(
        orderId,
        supportedDeliveryProviders[0]._id,
        requestContext,
      );
    }

    // Init payment provider
    const supportedPaymentProviders = await modules.payment.paymentProviders.findSupported(
      { order: updatedOrder },
      requestContext,
    );

    const orderPayment = await modules.orders.payments.findOrderPayment({
      orderPaymentId: updatedOrder.paymentId,
    });
    const paymentProviderId = orderPayment?.paymentProviderId;

    const isAlreadyInitializedWithSupportedPaymentProvider = supportedPaymentProviders.some(
      (provider) => {
        return provider._id === paymentProviderId;
      },
    );

    if (supportedPaymentProviders.length > 0 && !isAlreadyInitializedWithSupportedPaymentProvider) {
      const paymentCredentials = await modules.payment.paymentCredentials.findPaymentCredentials(
        { userId: updatedOrder.userId, isPreferred: true },
        {
          sort: {
            created: -1,
          },
        },
      );

      if (paymentCredentials?.length) {
        const foundSupportedPreferredProvider = supportedPaymentProviders.find(
          (supportedPaymentProvider) => {
            return paymentCredentials.some((paymentCredential) => {
              return supportedPaymentProvider._id === paymentCredential.paymentProviderId;
            });
          },
        );

        if (foundSupportedPreferredProvider) {
          await modules.orders.setPaymentProvider(
            orderId,
            foundSupportedPreferredProvider._id,
            requestContext,
          );
        }
      }
      updatedOrder = await modules.orders.setPaymentProvider(
        orderId,
        supportedPaymentProviders[0]._id,
        requestContext,
      );
    }
    return updatedOrder;
  };

  const updateCalculation: OrdersModule['updateCalculation'] = async (orderId, requestContext) => {
    const { modules } = requestContext;

    await updateDiscounts(orderId, requestContext);

    const order = await initProviders(orderId, requestContext);

    let orderPositions = await findOrderPositions(order);
    orderPositions = await Promise.all(
      orderPositions.map((orderPosition) =>
        modules.orders.positions.updateCalculation(orderPosition, requestContext),
      ),
    );

    let orderDelivery = await findOrderDelivery(order);
    if (orderDelivery) {
      orderDelivery = await modules.orders.deliveries.updateCalculation(orderDelivery, requestContext);
    }
    let orderPayment = await findOrderPayment(order);
    if (orderPayment) {
      orderPayment = await modules.orders.payments.updateCalculation(orderPayment, requestContext);
    }

    await Promise.all(
      orderPositions.map((orderPosition) =>
        modules.orders.positions.updateScheduling(
          { order, orderDelivery, orderPosition },
          requestContext,
        ),
      ),
    );

    const pricing = await OrderPricingDirector.actions({ order }, requestContext);
    const calculation = await pricing.calculate();

    const selector = generateDbFilterById(orderId);

    await Orders.updateOne(selector, {
      $set: {
        calculation,
        updated: new Date(),
        updatedBy: requestContext.userId,
      },
    });

    return Orders.findOne(selector, {});
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
    updateCalculation,
    updateStatus,
  });
  const orderMutations = configureOrderModuleMutations({
    Orders,
    OrderDeliveries,
    OrderPayments,
    initProviders,
    updateCalculation,
    updateStatus,
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
