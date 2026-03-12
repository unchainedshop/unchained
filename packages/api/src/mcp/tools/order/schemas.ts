import { z } from 'zod/v4-mini';
import {
  PaginationSchema,
  SortingSchema,
  SearchSchema,
  DateRangeSchema,
  OrderFilterSchema,
  createManagementSchemaFromValidators,
} from '../../utils/sharedSchemas.ts';

export const OrderStatusEnum = z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']);
export const PaymentProviderTypeEnum = z.enum(['CARD', 'INVOICE', 'GENERIC']);
export const DeliveryProviderTypeEnum = z.enum(['PICKUP', 'SHIPPING', 'LOCAL']);
export const SortDirectionEnum = z.enum(['ASC', 'DESC']);

export const SortOptionInput = z.strictObject({
  key: z.string().check(z.minLength(1), z.describe('Field to sort by')),
  value: SortDirectionEnum.check(z.describe('Sort direction')),
});

export const DateFilterInput = z.object(DateRangeSchema);

export const actionValidators = {
  LIST: z.object({
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
    ...OrderFilterSchema,
    includeCarts: z.optional(z.boolean()).check(z.describe('Include cart orders in results')),
    paymentProviderTypes: z
      .optional(z.array(PaymentProviderTypeEnum))
      .check(z.describe('Filter by payment provider types')),
    deliveryProviderTypes: z
      .optional(z.array(DeliveryProviderTypeEnum))
      .check(z.describe('Filter by delivery provider types')),
    dateRange: z.optional(DateFilterInput).check(z.describe('Date range filter')),
  }),

  SALES_SUMMARY: z.object({
    ...DateRangeSchema,
    ...OrderFilterSchema,
    days: z
      .optional(z.int().check(z.gte(1), z.lte(365)))
      .check(z.describe('Number of days for daily breakdown (default: 30)')),
  }),

  MONTHLY_BREAKDOWN: z.object({
    ...DateRangeSchema,
    ...OrderFilterSchema,
  }),

  TOP_CUSTOMERS: z.object({
    ...PaginationSchema,
    ...DateRangeSchema,
    customerStatus: z.optional(z.string()).check(z.describe('Order status for customer analysis')),
  }),

  TOP_PRODUCTS: z.object({
    ...PaginationSchema,
    ...DateRangeSchema,
  }),
  GET_CART: z.object({
    userId: z.string().check(z.describe('User ID to get cart for')),
    orderNumber: z
      .optional(z.string())
      .check(z.describe('Optional orderNumber if known to get user cart')),
  }),
  GET: z
    .object({
      orderId: z.optional(z.string()).check(z.describe('Order ID of the order')),
      orderNumber: z
        .optional(z.string())
        .check(z.describe('Optional orderNumber if known to get user cart')),
    })
    .check(
      z.superRefine((data, ctx) => {
        if (!data?.orderId && !data?.orderNumber) {
          ctx.addIssue({
            code: 'custom',
            message: 'Either orderId or orderNumber is required',
            path: ['GET'],
          });
        }
      }),
    ),
  PAY_ORDER: z
    .object({
      orderId: z
        .string({
          error: (issue) =>
            issue.input ? 'orderId is required to pay an order' : 'orderId must be a string',
        })
        .check(
          z.minLength(1, 'orderId cannot be empty'),
          z.describe('The unique identifier of the order to mark as PAID'),
        ),
    })
    .check(
      z.describe(
        "This operation is used for manually marking an order's payment as PAID. " +
          'The following conditions must be met:\n' +
          '- The order must already exist and must not be in OPEN (cart) status.\n' +
          '- The order must have a valid payment record.\n' +
          '- The payment status of the order must currently be OPEN.\n' +
          'If these conditions are not met, an appropriate error will be thrown.',
      ),
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
        .check(
          z.minLength(1, 'orderId cannot be empty'),
          z.describe('The unique identifier of the order to mark as DELIVERED'),
        ),
    })
    .check(
      z.describe(
        "This operation is used for manually marking an order's delivery as DELIVERED. " +
          'The following conditions must be met:\n' +
          '- The order must exist and must not be in OPEN (cart) status.\n' +
          '- The order must have a valid delivery record.\n' +
          '- The delivery status of the order must currently be OPEN, if the order is confirmed.\n' +
          'If these conditions are not satisfied, an appropriate error will be thrown.',
      ),
    ),
  CONFIRM_ORDER: z
    .object({
      orderId: z
        .string({
          error: (issue) => (issue.input ? 'orderId is required' : 'orderId must be a string'),
        })
        .check(z.minLength(1, 'orderId cannot be empty')),
      paymentContext: z
        .optional(z.record(z.any(), z.any()))
        .check(z.describe('Optional JSON context related to payment (e.g., transaction details).')),
      deliveryContext: z
        .optional(z.record(z.any(), z.any()))
        .check(z.describe('Optional JSON context related to delivery (e.g., shipping info).')),
      comment: z
        .optional(z.string())
        .check(z.describe('Optional comment or note to attach to the order confirmation.')),
    })
    .check(
      z.describe(
        'Confirms an order. Requirements:\n' +
          '- The order must exist.\n' +
          '- The order status must be PENDING.\n' +
          '- paymentContext, deliveryContext, and comment are optional additional inputs.',
      ),
    ),
  REJECT_ORDER: z
    .object({
      orderId: z
        .string({
          error: (issue) => (issue.input ? 'orderId is required' : 'orderId must be a string'),
        })
        .check(
          z.minLength(1, 'orderId cannot be empty'),
          z.describe('The unique identifier of the order to reject.'),
        ),
      paymentContext: z
        .optional(z.record(z.any(), z.any()))
        .check(z.describe('Optional JSON context related to payment, e.g., transaction adjustments.')),
      deliveryContext: z
        .optional(z.record(z.any(), z.any()))
        .check(z.describe('Optional JSON context related to delivery, e.g., shipment adjustments.')),
      comment: z
        .optional(z.string())
        .check(z.describe('Optional comment explaining the reason for rejecting the order.')),
    })
    .check(
      z.describe(
        'Manually rejects an order which is currently PENDING. ' +
          'All additional properties (paymentContext, deliveryContext, comment) are forwarded to services.orders.rejectOrder.',
      ),
    ),
} as const;

export const OrderManagementSchema = createManagementSchemaFromValidators(actionValidators);

export type { ManagementParams as OrderManagementParams } from '../../utils/sharedSchemas.ts';

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (orderModule: any, params: Params<T>) => Promise<unknown>;
