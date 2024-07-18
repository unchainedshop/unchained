import { ModuleInput, UnchainedCore } from '@unchainedshop/types/core.js';
import { Order, OrdersModule, OrdersSettingsOptions } from '@unchainedshop/types/orders.js';
import { OrderDelivery } from '@unchainedshop/types/orders.deliveries.js';
import { OrderPayment } from '@unchainedshop/types/orders.payments.js';
import { OrderPosition } from '@unchainedshop/types/orders.positions.js';
import { generateDbFilterById } from '@unchainedshop/mongodb';
import { createRequire } from 'node:module';
import { OrderDeliveriesCollection } from '../db/OrderDeliveriesCollection.js';
import { OrderDiscountsCollection } from '../db/OrderDiscountsCollection.js';
import { OrderDiscountTrigger } from '../db/OrderDiscountTrigger.js';
import { OrderPaymentsCollection } from '../db/OrderPaymentsCollection.js';
import { OrderPositionsCollection } from '../db/OrderPositionsCollection.js';
import { OrdersCollection } from '../db/OrdersCollection.js';
import { OrderDiscountDirector } from '../director/OrderDiscountDirector.js';
import { OrderPricingDirector } from '../director/OrderPricingDirector.js';
import { ordersSettings } from '../orders-settings.js';
import { configureOrderDeliveriesModule } from './configureOrderDeliveriesModule.js';
import { configureOrderDiscountsModule } from './configureOrderDiscountsModule.js';
import { configureOrderPaymentsModule } from './configureOrderPaymentsModule.js';
import { configureOrderPositionsModule } from './configureOrderPositionsModule.js';
import { configureOrderModuleMutations } from './configureOrdersModule-mutations.js';
import { configureOrderModuleProcessing } from './configureOrdersModule-processing.js';
import { configureOrdersModuleQueries } from './configureOrdersModule-queries.js';
import { configureOrderModuleTransformations } from './configureOrdersModule-transformations.js';

const require = createRequire(import.meta.url);
const { Locker, MongoAdapter } = require('@kontsedal/locco');

export const configureOrdersModule = async ({
  db,
  options: orderOptions = {},
}: ModuleInput<OrdersSettingsOptions>): Promise<OrdersModule> => {
  ordersSettings.configureSettings(orderOptions);

  const Orders = await OrdersCollection(db);
  const OrderDeliveries = await OrderDeliveriesCollection(db);
  const OrderDiscounts = await OrderDiscountsCollection(db);
  const OrderPayments = await OrderPaymentsCollection(db);
  const OrderPositions = await OrderPositionsCollection(db);

  const mongoAdapter = new MongoAdapter({
    client: {
      db: () => db,
    },
  });
  const locker = new Locker({
    adapter: mongoAdapter,
    retrySettings: { retryDelay: 200, retryTimes: 10 },
  });

  const findOrderPositions = async (order: Order) =>
    OrderPositions.find(
      {
        orderId: order._id,
        quantity: { $gt: 0 },
      },
      {},
    ).toArray();

  const findOrderDelivery = async (order: Order) =>
    OrderDeliveries.findOne(generateDbFilterById(order.deliveryId), {});

  const findOrderPayment = async (order: Order) =>
    OrderPayments.findOne(generateDbFilterById(order.paymentId), {});

  const updateDiscounts = async (order: Order, unchainedAPI: UnchainedCore) => {
    const { modules } = unchainedAPI;

    // 1. go through existing order-discounts and check if discount still valid,
    // those who are not valid anymore should get removed
    const discounts = await modules.orders.discounts.findOrderDiscounts({
      orderId: order._id,
    });

    await Promise.all(
      discounts.map(async (discount) => {
        const isValid = await modules.orders.discounts.isValid(discount, unchainedAPI);

        if (!isValid) {
          await modules.orders.discounts.delete(discount._id, unchainedAPI);
        }
      }),
    );

    // 2. run auto-system discount
    const cleanedDiscounts = await modules.orders.discounts.findOrderDiscounts({
      orderId: order._id,
    });

    const currentDiscountKeys = cleanedDiscounts.map(({ discountKey }) => discountKey);

    const director = await OrderDiscountDirector.actions({ order, code: null }, unchainedAPI);
    const systemDiscounts = await director.findSystemDiscounts();

    await Promise.all(
      systemDiscounts
        .filter((key) => currentDiscountKeys.indexOf(key) === -1)
        .map(async (discountKey) =>
          modules.orders.discounts.create({
            orderId: order._id,
            discountKey,
            trigger: OrderDiscountTrigger.SYSTEM,
          }),
        ),
    );
  };

  const initProviders = async (order: Order, unchainedAPI: UnchainedCore) => {
    const { modules } = unchainedAPI;

    let updatedOrder = order;

    // Init delivery provider
    const supportedDeliveryProviders = await modules.delivery.findSupported(
      { order: updatedOrder },
      unchainedAPI,
    );

    const orderDelivery = await modules.orders.deliveries.findDelivery({
      orderDeliveryId: updatedOrder.deliveryId,
    });
    const deliveryProviderId = orderDelivery?.deliveryProviderId;

    const isAlreadyInitializedWithSupportedDeliveryProvider = supportedDeliveryProviders?.some(
      (provider) => {
        return provider._id === deliveryProviderId;
      },
    );

    if (supportedDeliveryProviders?.length > 0 && !isAlreadyInitializedWithSupportedDeliveryProvider) {
      const defaultOrderDeliveryProvider = await modules.delivery.determineDefault(
        supportedDeliveryProviders,
        { order: updatedOrder },
        unchainedAPI,
      );
      if (defaultOrderDeliveryProvider) {
        updatedOrder = await modules.orders.setDeliveryProvider(
          updatedOrder._id,
          defaultOrderDeliveryProvider._id,
          unchainedAPI,
        );
      }
    }

    // Init payment provider
    const supportedPaymentProviders = await modules.payment.paymentProviders.findSupported(
      { order: updatedOrder },
      unchainedAPI,
    );

    const orderPayment = await modules.orders.payments.findOrderPayment({
      orderPaymentId: updatedOrder.paymentId,
    });
    const paymentProviderId = orderPayment?.paymentProviderId;

    const isAlreadyInitializedWithSupportedPaymentProvider = supportedPaymentProviders?.some(
      (provider) => {
        return provider._id === paymentProviderId;
      },
    );

    if (supportedPaymentProviders?.length > 0 && !isAlreadyInitializedWithSupportedPaymentProvider) {
      const paymentCredentials = await modules.payment.paymentCredentials.findPaymentCredentials(
        { userId: updatedOrder.userId, isPreferred: true },
        {
          sort: {
            created: -1,
          },
        },
      );

      const defaultOrderPaymentProvider = await modules.payment.paymentProviders.determineDefault(
        supportedPaymentProviders,
        { order: updatedOrder, paymentCredentials },
        unchainedAPI,
      );

      if (defaultOrderPaymentProvider) {
        updatedOrder = await modules.orders.setPaymentProvider(
          updatedOrder._id,
          defaultOrderPaymentProvider._id,
          unchainedAPI,
        );
      }
    }
    return updatedOrder;
  };

  const updateCalculation: OrdersModule['updateCalculation'] = async (orderId, unchainedAPI) => {
    const { modules } = unchainedAPI;

    const selector = generateDbFilterById(orderId);
    const order = (await Orders.findOne(selector, {})) as Order;

    // Don't recalculate orders, only carts
    if (order.status !== null) return order;

    await updateDiscounts(order, unchainedAPI);

    let orderPositions = (await findOrderPositions(order)) as OrderPosition[];
    orderPositions = await Promise.all(
      orderPositions.map(async (orderPosition) =>
        modules.orders.positions.updateCalculation(orderPosition, unchainedAPI),
      ),
    );

    let orderDelivery = (await findOrderDelivery(order)) as OrderDelivery;
    if (orderDelivery) {
      orderDelivery = await modules.orders.deliveries.updateCalculation(orderDelivery, unchainedAPI);
    }
    let orderPayment = (await findOrderPayment(order)) as OrderPayment;
    if (orderPayment) {
      orderPayment = await modules.orders.payments.updateCalculation(orderPayment, unchainedAPI);
    }

    orderPositions = await Promise.all(
      orderPositions.map(async (orderPosition) =>
        modules.orders.positions.updateScheduling({ order, orderDelivery, orderPosition }, unchainedAPI),
      ),
    );

    const pricing = await OrderPricingDirector.actions(
      { order, orderPositions, orderDelivery, orderPayment },
      unchainedAPI,
    );

    const calculation = await pricing.calculate();
    const updated = new Date();

    await Orders.updateOne(selector, {
      $set: {
        calculation,
        updated,
      },
    });

    /*
       // We have to do initProviders after calculation, only then filterSupportedProviders will work correctly and has access to recent pricing
       // initProviders calls updateCalculation anyways recursively when a new payment or delivery provider gets set
       // Thus, if for example a discount change leads to a free delivery and free payment due to free items amount, the following happens in the stack:
        // 1. create discount
        // 2. update calculation -> order pricing updated to items 0
        // 3. initProviders with updated order -> filterSupportedProviders -> delivery provider is invalid -> set new delivery provider
        // 4. update calculation -> order pricing updated to items 0 and delivery 0
        // 5. initProviders with updated order -> filterSupportedProviders -> payment provider is invalid -> set new payment provider
        // 6. update calculation -> order pricing updated to items 0, delivery 0, payment 0
        // 7. initProviders with updated order -> all providers are valid -> return order
    */
    return initProviders(
      {
        ...order,
        calculation,
        updated,
      },
      unchainedAPI,
    );
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
    locker,
  });
  const orderMutations = configureOrderModuleMutations({
    Orders,
    OrderDeliveries,
    OrderPayments,
    OrderPositions,
    initProviders,
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
