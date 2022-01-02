import { Context } from '@unchainedshop/types/api';
import {
  FindOptions,
  ModuleInput,
  ModuleMutations,
  Query,
  Update,
  _ID,
} from '@unchainedshop/types/common';
import { Order, OrdersModule } from '@unchainedshop/types/orders';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log } from 'meteor/unchained:logger';
import {
  generateDbFilterById,
  generateDbMutations,
  objectInvert,
} from 'meteor/unchained:utils';
import { OrderDeliveriesCollection } from 'src/db/OrderDeliveriesCollection';
import { OrderDiscountsCollection } from 'src/db/OrderDiscountsCollection';
import { OrderPaymentsCollection } from 'src/db/OrderPaymentsCollection';
import { OrderPositionsCollection } from 'src/db/OrderPositionsCollection';
import { orderSettings } from 'src/orders-settings';
import { OrdersCollection } from '../db/OrdersCollection';
import { OrdersSchema } from '../db/OrdersSchema';
import { OrderStatus } from '../db/OrderStatus';
import { OrderPricingDirector } from '../director/OrderPricingDirector';
import { OrderPricingSheet } from '../director/OrderPricingSheet';

const ORDER_EVENTS: string[] = [
  'ORDER_ADD_DISCOUNT',
  'ORDER_ADD_PRODUCT',
  'ORDER_CHECKOUT',
  'ORDER_CONFIRMED',
  'ORDER_CREATE',
  'ORDER_FULLFILLED',
  'ORDER_REMOVE',
  'ORDER_SET_DELIVERY_PROVIDER',
  'ORDER_SET_PAYMENT_PROVIDER',
  'ORDER_UPDATE',
];


type FindQuery = {
  includeCarts?: boolean;
  queryString?: string;
};

const buildFindSelector = ({ includeCarts, queryString }: FindQuery) => {
  const selector: Query = {};
  if (!includeCarts) selector.status = { $ne: null };
  if (queryString) {
    selector.$text = { $search: queryString };
  }
  return selector;
};

export const configureOrdersModule = async ({
  db,
}: ModuleInput): Promise<OrdersModule> => {
  registerEvents(ORDER_EVENTS);

  const Orders = await OrdersCollection(db);
  const OrderDeliveries = await OrderDeliveriesCollection(db);
  const OrderDiscounts = await OrderDiscountsCollection(db);
  const OrderPayments = await OrderPaymentsCollection(db);
  const OrderPositions = await OrderPositionsCollection(db);

  const mutations = generateDbMutations<Order>(
    Orders,
    OrdersSchema
  ) as ModuleMutations<Order>;

  const findOrdersByUser = async (query: Query) => {
    const { includeCarts, status, userId, ...rest } = query;

    const selector: Query = { userId, ...rest };
    if (!includeCarts || status) {
      selector.status = status || { $ne: OrderStatus.OPEN };
    }
    const options: FindOptions = {
      sort: {
        updated: -1,
      },
    };
    const orders = Orders.find(selector, options);
    return orders.toArray();
  };

  const findOrderPositions = async (order: Order) =>
    await OrderPositions.find(
      generateDbFilterById(order._id, { quantity: { $gt: 0 } })
    ).toArray();

  const findOrderDelivery = async (order: Order) =>
    await OrderDeliveries.findOne({ _id: order.deliveryId });

  const findOrderDiscounts = async (order: Order) =>
    await OrderDiscounts.findOne({ orderId: order._id });

  const findOrderPayment = async (order: Order) =>
    await OrderPayments.findOne({ _id: order.paymentId });

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

  const missingInputDataForCheckout = async (order: Order) => {
    const errors = [];
    if (order.status !== OrderStatus.OPEN)
      errors.push(new Error('Order has already been checked out'));
    if (!order.contact) errors.push(new Error('Contact data not provided'));
    if (!order.billingAddress)
      errors.push(new Error('Billing address not provided'));

    const items = await findOrderPositions(order);
    const totalQuantity = items.reduce(
      (oldValue, item) => oldValue + item.quantity,
      0
    );
    if (totalQuantity === 0) errors.push(new Error('No items in cart'));
    if (!(await findOrderDelivery(order)))
      errors.push('No delivery provider selected');
    if (!(await findOrderPayment(order)))
      errors.push('No payment provider selected');
    return errors;
  };

  const updateCalculation = async (
    orderId: _ID,
    requestContext: Context
  ): Promise<Order> => {
    const selector = generateDbFilterById(orderId);
    const order = await Orders.findOne(selector);

    await OrderDiscounts.updateDiscounts({ orderId });

    initProviders(order);

    const items = await findOrderPositions(order);
    const updatedItems = items.map((item) => item.updateCalculation());

    const orderDelivery = findOrderDelivery(order);
    const orderPayment = findOrderPayment(order);
    orderDelivery()?.updateCalculation();
    orderPayment?.updateCalculation();

    updatedItems.forEach((item) => item.updateScheduling());

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

  return {
    // Queries
    count: async (query) => {
      const orderCount = await Orders.find(buildFindSelector(query)).count();
      return orderCount;
    },

    findOrder: async ({ orderId, orderNumber }, options) => {
      const selector = orderId
        ? generateDbFilterById(orderId)
        : { orderNumber };

      return await Orders.findOne(selector, options);
    },

    findOrders: async ({ limit, offset, queryString, ...query }, options) => {
      const findOptions: FindOptions = {
        skip: offset,
        limit,
        sort: {
          created: -1,
        },
      };
      const selector = buildFindSelector({ queryString, ...query });

      if (queryString) {
        return await Orders.find(selector, {
          ...options,
          projection: { score: { $meta: 'textScore' } },
          sort: { score: { $meta: 'textScore' } },
        }).toArray();
      }

      return await Orders.find(selector, findOptions).toArray();
    },

    orderExists: async ({ orderId }) => {
      const orderCount = await Orders.find(generateDbFilterById(orderId), {
        limit: 1,
      }).count();
      return !!orderCount;
    },

    // Transformations
    normalizedStatus: (order) => {
      return objectInvert(OrderStatus)[order.status || null];
    },
    nextStatus: async (order) => {
      let status = order.status;

      if (status === OrderStatus.OPEN || !status) {
        if ((await missingInputDataForCheckout(order)).length === 0) {
          emit('ORDER_CHECKOUT', { order });
          status = OrderStatus.PENDING;
        }
      }
      if (status === OrderStatus.PENDING) {
        if (this.isAutoConfirmationEnabled()) {
          emit('ORDER_CONFIRMED', { order });
          status = OrderStatus.CONFIRMED;
        }
      }
      if (status === OrderStatus.CONFIRMED) {
        if (this.isAutoFullfillmentEnabled()) {
          emit('ORDER_FULLFILLED', { order });
          status = OrderStatus.FULLFILLED;
        }
      }
      return status;
    },

    isCart: (order) => {
      return (order.status || null) === OrderStatus.OPEN;
    },
    cart: async (order, user) => {
      const selector: Query = {
        countryCode: order.countryContext || user.lastLogin.countryContext,
        status: { $eq: OrderStatus.OPEN },
      };

      if (order.orderNumber) {
        selector.orderNumber = order.orderNumber;
      }

      const carts = await findOrdersByUser(selector);

      if (carts.length > 0) {
        return carts[0];
      }
      return null;
    },

    pricingSheet: (order) => {
      return OrderPricingSheet({
        calculation: order.calculation,
        currency: order.currency,
      });
    },

    // Checkout
    checkout: async (order, params, userId) => {},
    confirm: async (order, params, userId) => {},
    processOrder: async (order, params, userId) => {},

    // Mutations

    create: async (
      { orderNumber, currency, countryCode, billingAddress, contact },
      userId
    ) => {
      const orderId = await mutations.create(
        {
          created: new Date(),
          createdBy: userId,
          status: null,
          billingAddress,
          contact,
          userId,
          currency,
          countryCode,
          calculation: [],
          log: [],
          orderNumber,
        },
        userId
      );

      const order = await Orders.findOne(generateDbFilterById(orderId));
      emit('ORDER_CREATE', { order });
      return order;
    },

    delete: async (orderId, userId) => {
      const deletedCount = await mutations.delete(orderId, userId);
      emit('ORDER_REMOVE', { orderId });
      return deletedCount;
    },

    setDeliveryProvider: async (
      orderId,
      deliveryProviderId,
      requestContext
    ) => {
      const delivery = await OrderDeliveries.findOne({
        orderId,
        deliveryProviderId,
      });
      const deliveryId = delivery
        ? delivery._id
        : OrderDeliveries.createOrderDelivery({ orderId, deliveryProviderId })
            ._id;

      log(`Set Delivery Provider ${deliveryProviderId}`, { orderId });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: { deliveryId, updated: new Date(), updatedBy: userId },
      });

      const order = await updateCalculation(orderId, requestContext);

      emit('ORDER_SET_DELIVERY_PROVIDER', {
        order,
        deliveryProviderId,
      });

      return order;
    },

    setPaymentProvider: async (orderId, paymentProviderId, requestContext) => {
      const payment = await OrderPayments.findOne({
        orderId,
        paymentProviderId,
      });
      const paymentId = payment
        ? payment._id
        : OrderPayments.createOrderPayment({ orderId, paymentProviderId })._id;

      log(`Set Payment Provider ${paymentProviderId}`, { orderId });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: { paymentId, updated: new Date() },
      });

      const order = await updateCalculation(orderId, requestContext);

      emit('ORDER_SET_PAYMENT_PROVIDER', {
        order,
        paymentProviderId,
      });
      
      return order;
    },

    updateBillingAddress: async (orderId, billingAddress, requestContext) => {
      log('Update Invoicing Address', { orderId });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: {
          billingAddress,
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      const order = await updateCalculation(orderId, requestContext);
      emit('ORDER_UPDATE', { order, field: 'billing' });
      return order;
    },

    updateContact: async (orderId, contact, requestContext) => {
      log('Update Contact', { orderId });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: {
          contact,
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      const order = await updateCalculation(orderId, requestContext);
      emit('ORDER_UPDATE', { order, field: 'contact' });
      return order;
    },

    updateContext: async (orderId, context, requestContext) => {
      log('Update Arbitrary Context', { orderId });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: {
          context,
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      const order = await updateCalculation(orderId, requestContext);
      emit('ORDER_UPDATE', { order, field: 'context' });
      return order;
    },

    updateStatus: async (orderId, { status, info }, requestContext) => {
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
    },

    updateCalculation,

    // Subentities
    // deliveries: configureOrderDeliveriesModule,
    // discount: configureOrderDiscountModule,
    // positions: configureOrderPositionsModule,
    // payments: configureOrderPaymentsModule,
  };
};
