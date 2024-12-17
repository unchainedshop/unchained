import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbObjectId, mongodb } from '@unchainedshop/mongodb';
import { OrderDiscountTrigger } from '../db/OrderDiscountTrigger.js';
import { OrderDiscount } from '../types.js';

const ORDER_DISCOUNT_EVENTS: string[] = [
  'ORDER_CREATE_DISCOUNT',
  'ORDER_UPDATE_DISCOUNT',
  'ORDER_REMOVE_DISCOUNT',
];

export const buildFindByIdSelector = (orderDiscountId: string) =>
  generateDbFilterById(orderDiscountId) as mongodb.Filter<OrderDiscount>;

export const configureOrderDiscountsModule = ({
  OrderDiscounts,
}: {
  OrderDiscounts: mongodb.Collection<OrderDiscount>;
}) => {
  registerEvents(ORDER_DISCOUNT_EVENTS);

  return {
    // Queries
    findOrderDiscount: async (
      { discountId }: { discountId: string },
      options?: mongodb.FindOptions,
    ): Promise<OrderDiscount> => {
      return OrderDiscounts.findOne(buildFindByIdSelector(discountId), options);
    },

    findOrderDiscounts: async ({ orderId }: { orderId: string }): Promise<Array<OrderDiscount>> => {
      const discounts = OrderDiscounts.find({ orderId });
      return discounts.toArray();
    },

    create: async (doc: OrderDiscount): Promise<OrderDiscount> => {
      const normalizedTrigger = doc.trigger || OrderDiscountTrigger.USER;
      const { insertedId: discountId } = await OrderDiscounts.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        ...doc,
        trigger: normalizedTrigger,
      });
      const discount = await OrderDiscounts.findOne({
        _id: discountId,
      });
      await emit('ORDER_CREATE_DISCOUNT', { discount });
      return discount;
    },

    delete: async (orderDiscountId: string): Promise<OrderDiscount> => {
      const selector = buildFindByIdSelector(orderDiscountId);
      const orderDiscount = await OrderDiscounts.findOneAndDelete(selector);
      await emit('ORDER_REMOVE_DISCOUNT', { discount: orderDiscount });
      return orderDiscount;
    },

    isDiscountCodeUsed: async ({ code, orderId }): Promise<boolean> => {
      return (
        (await OrderDiscounts.countDocuments({
          code,
          orderId,
        })) > 0
      );
    },

    findSpareDiscount: async ({ code }): Promise<OrderDiscount> => {
      return OrderDiscounts.findOne({
        code,
        orderId: { $in: [undefined, null] },
      });
    },

    update: async (orderDiscountId: string, doc: OrderDiscount): Promise<OrderDiscount> => {
      const discount = await OrderDiscounts.findOneAndUpdate(
        { _id: orderDiscountId },
        {
          $set: {
            updated: new Date(),
            ...doc,
          },
        },
        { returnDocument: 'after' },
      );

      await emit('ORDER_UPDATE_DISCOUNT', { discount });
      return discount;
    },
    deleteOrderDiscounts: async (orderId: string) => {
      const { deletedCount } = await OrderDiscounts.deleteMany({ orderId });
      return deletedCount;
    },
  };
};

export type OrderDiscountsModule = ReturnType<typeof configureOrderDiscountsModule>;
