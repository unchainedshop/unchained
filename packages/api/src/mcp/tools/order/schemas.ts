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
} as const;

export const OrderManagementSchema = {
  action: z
    .enum(['LIST', 'SALES_SUMMARY', 'MONTHLY_BREAKDOWN', 'TOP_CUSTOMERS', 'TOP_PRODUCTS'])
    .describe(
      'Order action: LIST (get orders with filters), SALES_SUMMARY (daily sales analytics), MONTHLY_BREAKDOWN (12-month sales analysis), TOP_CUSTOMERS (highest spending customers), TOP_PRODUCTS (best-selling products)',
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
};

export const OrderManagementZodSchema = z.object(OrderManagementSchema);
export type OrderManagementParams = z.infer<typeof OrderManagementZodSchema>;

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (orderModule: any, params: Params<T>) => Promise<unknown>;
