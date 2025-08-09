import { z } from 'zod';

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

export const DateFilterInput = z.object({
  from: z.string().datetime().optional().describe('Start date (ISO format)'),
  to: z.string().datetime().optional().describe('End date (ISO format)'),
});

export const actionValidators = {
  LIST: z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe('Maximum results to return (default: 10)'),
    offset: z.number().int().min(0).optional().describe('Number of records to skip for pagination'),
    includeCarts: z.boolean().optional().describe('Include cart orders in results'),
    queryString: z.string().optional().describe('Search term for order filtering'),
    status: z.array(OrderStatusEnum).optional().describe('Filter by order status'),
    sort: z.array(SortOptionInput).optional().describe('Sort order for results'),
    paymentProviderTypes: z
      .array(PaymentProviderTypeEnum)
      .optional()
      .describe('Filter by payment provider types'),
    deliveryProviderTypes: z
      .array(DeliveryProviderTypeEnum)
      .optional()
      .describe('Filter by delivery provider types'),
    paymentProviderIds: z
      .array(z.string().min(1))
      .optional()
      .describe('Filter by specific payment provider IDs'),
    deliveryProviderIds: z
      .array(z.string().min(1))
      .optional()
      .describe('Filter by specific delivery provider IDs'),
    dateRange: DateFilterInput.optional().describe('Date range filter'),
  }),

  SALES_SUMMARY: z.object({
    from: z.string().datetime().optional().describe('Start date for analytics'),
    to: z.string().datetime().optional().describe('End date for analytics'),
    days: z
      .number()
      .int()
      .min(1)
      .max(365)
      .optional()
      .describe('Number of days for daily breakdown (default: 30)'),
    paymentProviderIds: z
      .array(z.string().min(1))
      .optional()
      .describe('Filter by specific payment provider IDs'),
    deliveryProviderIds: z
      .array(z.string().min(1))
      .optional()
      .describe('Filter by specific delivery provider IDs'),
    status: z.array(OrderStatusEnum).optional().describe('Filter by order status'),
  }),

  MONTHLY_BREAKDOWN: z.object({
    from: z.string().datetime().optional().describe('Start date for analytics'),
    to: z.string().datetime().optional().describe('End date for analytics'),
    paymentProviderIds: z
      .array(z.string().min(1))
      .optional()
      .describe('Filter by specific payment provider IDs'),
    deliveryProviderIds: z
      .array(z.string().min(1))
      .optional()
      .describe('Filter by specific delivery provider IDs'),
    status: z.array(OrderStatusEnum).optional().describe('Filter by order status'),
  }),

  TOP_CUSTOMERS: z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe('Maximum results to return (default: 10)'),
    customerStatus: z.string().optional().describe('Order status for customer analysis'),
    from: z.string().datetime().optional().describe('Start date for analytics'),
    to: z.string().datetime().optional().describe('End date for analytics'),
  }),

  TOP_PRODUCTS: z.object({
    from: z.string().datetime().optional().describe('Start date for analytics'),
    to: z.string().datetime().optional().describe('End date for analytics'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe('Maximum results to return (default: 10)'),
  }),
} as const;

export const OrderManagementSchema = {
  action: z
    .enum(['LIST', 'SALES_SUMMARY', 'MONTHLY_BREAKDOWN', 'TOP_CUSTOMERS', 'TOP_PRODUCTS'])
    .describe(
      'Order action: LIST (get orders with filters), SALES_SUMMARY (daily sales analytics), MONTHLY_BREAKDOWN (12-month sales analysis), TOP_CUSTOMERS (highest spending customers), TOP_PRODUCTS (best-selling products)',
    ),

  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe('Maximum results to return (default: 10 for LIST, 10 for analytics)'),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Number of records to skip for pagination (LIST only)'),
  includeCarts: z.boolean().optional().describe('Include cart orders in results (LIST only)'),
  queryString: z.string().optional().describe('Search term for order filtering (LIST only)'),
  status: z.array(OrderStatusEnum).optional().describe('Filter by order status'),
  sort: z.array(SortOptionInput).optional().describe('Sort order for results (LIST only)'),

  paymentProviderTypes: z
    .array(PaymentProviderTypeEnum)
    .optional()
    .describe('Filter by payment provider types'),
  deliveryProviderTypes: z
    .array(DeliveryProviderTypeEnum)
    .optional()
    .describe('Filter by delivery provider types'),
  paymentProviderIds: z
    .array(z.string().min(1))
    .optional()
    .describe('Filter by specific payment provider IDs'),
  deliveryProviderIds: z
    .array(z.string().min(1))
    .optional()
    .describe('Filter by specific delivery provider IDs'),

  dateRange: DateFilterInput.optional().describe('Date range filter'),
  from: z.string().datetime().optional().describe('Start date for analytics (alternative to dateRange)'),
  to: z.string().datetime().optional().describe('End date for analytics (alternative to dateRange)'),

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
