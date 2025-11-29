import { z } from 'zod';
import {
  PaginationSchema,
  SortingSchema,
  SearchSchema,
  DateRangeSchema,
  OrderFilterSchema,
} from '../../utils/sharedSchemas.js';

export const OrderStatusEnum = z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']);
export const PaymentProviderTypeEnum = z.enum(['CARD', 'INVOICE', 'GENERIC']);
export const DeliveryProviderTypeEnum = z.enum(['PICKUP', 'SHIPPING', 'LOCAL']);
export const SortDirectionEnum = z.enum(['ASC', 'DESC']);

export const SortOptionInput = z
  .object({
    key: z.string().min(1).describe('Field to sort by'),
    value: SortDirectionEnum.describe('Sort direction'),
  })
  .strict();

export const DateFilterInput = z.object(DateRangeSchema);

export const actionValidators = {
  LIST: z.object({
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
    ...OrderFilterSchema,
    includeCarts: z.boolean().optional().describe('Include cart orders in results'),
    paymentProviderTypes: z
      .array(PaymentProviderTypeEnum)
      .optional()
      .describe('Filter by payment provider types'),
    deliveryProviderTypes: z
      .array(DeliveryProviderTypeEnum)
      .optional()
      .describe('Filter by delivery provider types'),
    dateRange: DateFilterInput.optional().describe('Date range filter'),
  }),

  SALES_SUMMARY: z.object({
    ...DateRangeSchema,
    ...OrderFilterSchema,
    days: z
      .number()
      .int()
      .min(1)
      .max(365)
      .optional()
      .describe('Number of days for daily breakdown (default: 30)'),
  }),

  MONTHLY_BREAKDOWN: z.object({
    ...DateRangeSchema,
    ...OrderFilterSchema,
  }),

  TOP_CUSTOMERS: z.object({
    ...PaginationSchema,
    ...DateRangeSchema,
    customerStatus: z.string().optional().describe('Order status for customer analysis'),
  }),

  TOP_PRODUCTS: z.object({
    ...PaginationSchema,
    ...DateRangeSchema,
  }),
  GET_CART: z.object({
    userId: z.string().describe('User ID to get cart for'),
    orderNumber: z.string().optional().describe('Optional orderNumber if known to get user cart'),
  }),
  GET: z
    .object({
      orderId: z.string().optional().describe('Order ID of the order'),
      orderNumber: z.string().optional().describe('Optional orderNumber if known to get user cart'),
    })
    .superRefine((data, ctx) => {
      if (!data?.orderId && !data?.orderNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Either orderId or orderNumber is required',
          path: ['GET'],
        });
      }
    }),
  PAY_ORDER: z
    .object({
      orderId: z
        .string({
          error: (issue) =>
            issue.input ? 'orderId is required to pay an order' : 'orderId must be a string',
        })
        .min(1, 'orderId cannot be empty')
        .describe('The unique identifier of the order to mark as PAID'),
    })
    .describe(
      "This operation is used for manually marking an order's payment as PAID. " +
        'The following conditions must be met:\n' +
        '- The order must already exist and must not be in OPEN (cart) status.\n' +
        '- The order must have a valid payment record.\n' +
        '- The payment status of the order must currently be OPEN.\n' +
        'If these conditions are not met, an appropriate error will be thrown.',
    ),
  DELIVER_ORDER: z
    .object({
      orderId: z
        .string({
          error: (issue) =>
            issue.input
              ? 'orderId is required to mark an order as delivered'
              : 'orderId must be a string',
        })
        .min(1, 'orderId cannot be empty')
        .describe('The unique identifier of the order to mark as DELIVERED'),
    })
    .describe(
      "This operation is used for manually marking an order's delivery as DELIVERED. " +
        'The following conditions must be met:\n' +
        '- The order must exist and must not be in OPEN (cart) status.\n' +
        '- The order must have a valid delivery record.\n' +
        '- The delivery status of the order must currently be OPEN, if the order is confirmed.\n' +
        'If these conditions are not satisfied, an appropriate error will be thrown.',
    ),
  CONFIRM_ORDER: z
    .object({
      orderId: z
        .string({
          error: (issue) => (issue.input ? 'orderId is required' : 'orderId must be a string'),
        })
        .min(1, 'orderId cannot be empty'),
      paymentContext: z
        .record(z.any(), z.any())
        .optional()
        .describe('Optional JSON context related to payment (e.g., transaction details).'),
      deliveryContext: z
        .record(z.any(), z.any())
        .optional()
        .describe('Optional JSON context related to delivery (e.g., shipping info).'),
      comment: z
        .string()
        .optional()
        .describe('Optional comment or note to attach to the order confirmation.'),
    })
    .describe(
      'Confirms an order. Requirements:\n' +
        '- The order must exist.\n' +
        '- The order status must be PENDING.\n' +
        '- paymentContext, deliveryContext, and comment are optional additional inputs.',
    ),
  REJECT_ORDER: z
    .object({
      orderId: z
        .string({
          error: (issue) => (issue.input ? 'orderId is required' : 'orderId must be a string'),
        })
        .min(1, 'orderId cannot be empty')
        .describe('The unique identifier of the order to reject.'),
      paymentContext: z
        .record(z.any(), z.any())
        .optional()
        .describe('Optional JSON context related to payment, e.g., transaction adjustments.'),
      deliveryContext: z
        .record(z.any(), z.any())
        .optional()
        .describe('Optional JSON context related to delivery, e.g., shipment adjustments.'),
      comment: z
        .string()
        .optional()
        .describe('Optional comment explaining the reason for rejecting the order.'),
    })
    .describe(
      'Manually rejects an order which is currently PENDING. ' +
        'All additional properties (paymentContext, deliveryContext, comment) are forwarded to services.orders.rejectOrder.',
    ),
} as const;

export const OrderManagementSchema = {
  action: z
    .enum([
      'LIST',
      'SALES_SUMMARY',
      'MONTHLY_BREAKDOWN',
      'TOP_CUSTOMERS',
      'TOP_PRODUCTS',
      'GET_CART',
      'GET',
      'PAY_ORDER',
      'DELIVER_ORDER',
      'CONFIRM_ORDER',
      'REJECT_ORDER',
    ])
    .describe(
      'Order action: LIST (get orders with filters), SALES_SUMMARY (daily sales analytics), MONTHLY_BREAKDOWN (12-month sales analysis), TOP_CUSTOMERS (highest spending customers), TOP_PRODUCTS (best-selling products), GET_CART (user cart), GET (single order), PAY_ORDER (mark single order as PAID), DELIVER_ORDER (mark single order as DELIVERED), CONFIRM_ORDER (manually mark order as CONFIRMED), REJECT_ORDER (reject order that is in progress)',
    ),

  ...PaginationSchema,
  ...SortingSchema,
  ...SearchSchema,
  ...DateRangeSchema,
  ...OrderFilterSchema,
  includeCarts: z.boolean().optional().describe('Include cart orders in results (LIST only)'),
  paymentProviderTypes: z
    .array(PaymentProviderTypeEnum)
    .optional()
    .describe('Filter by payment provider types'),
  deliveryProviderTypes: z
    .array(DeliveryProviderTypeEnum)
    .optional()
    .describe('Filter by delivery provider types'),
  dateRange: DateFilterInput.optional().describe('Date range filter'),

  days: z
    .number()
    .int()
    .min(1)
    .max(365)
    .optional()
    .describe('Number of days for daily breakdown (SALES_SUMMARY only, default: 30)'),
  customerStatus: z
    .string()
    .optional()
    .describe('Order status for customer analysis (TOP_CUSTOMERS only)'),
  orderId: z
    .string()
    .optional()
    .describe(
      'Optional ID of order, to get user cart (GET, PAY_ORDER & DELIVERY_ORDER, CONFIRM_ORDER & REJECT_ORDER only)',
    ),
  orderNumber: z.string().optional().describe('Optional orderNumber oof a order (GET_CART & GET only)'),
  userId: z.string().optional().describe('User ID to get cart for (GET_CART only)'),
};

export const OrderManagementZodSchema = z.object(OrderManagementSchema);
export type OrderManagementParams = z.infer<typeof OrderManagementZodSchema>;

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (orderModule: any, params: Params<T>) => Promise<unknown>;
