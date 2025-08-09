import { z } from 'zod';
import { Context } from '../../../context.js';
import { configureOrderMcpModule, OrderStatusType } from '../../modules/configureOrderMcpModule.js';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { log } from '@unchainedshop/logger';

const OrderStatusEnum = z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']);
const PaymentProviderTypeEnum = z.enum(['CARD', 'INVOICE', 'GENERIC']);
const DeliveryProviderTypeEnum = z.enum(['PICKUP', 'SHIPPING', 'LOCAL']);
const SortDirectionEnum = z.enum(['ASC', 'DESC']);

const SortOptionInput = z
  .object({
    key: z.string().min(1).describe('Field to sort by'),
    value: SortDirectionEnum.describe('Sort direction'),
  })
  .strict();

const DateFilterInput = z.object({
  from: z.string().datetime().optional().describe('Start date (ISO format)'),
  to: z.string().datetime().optional().describe('End date (ISO format)'),
});

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

export async function orderManagement(context: Context, params: OrderManagementParams) {
  const { action } = params;
  log('MCP handler orderManagement ', { userId: context.userId, params });
  try {
    const orderModule = configureOrderMcpModule(context);

    switch (action) {
      case 'LIST': {
        const {
          limit = 10,
          offset = 0,
          includeCarts = false,
          queryString,
          status,
          sort,
          paymentProviderTypes = [],
          deliveryProviderTypes = [],
          paymentProviderIds = [],
          deliveryProviderIds = [],
          dateRange,
        } = params;

        const sortOptions =
          sort?.filter((s): s is { key: string; value: 'ASC' | 'DESC' } => Boolean(s.key && s.value)) ||
          undefined;

        const orders = await orderModule.list({
          limit,
          offset,
          includeCarts,
          queryString,
          status: status as OrderStatusType[],
          sort: sortOptions,
          paymentProviderTypes: paymentProviderTypes as PaymentProviderType[],
          deliveryProviderTypes: deliveryProviderTypes as DeliveryProviderType[],
          paymentProviderIds,
          deliveryProviderIds,
          dateRange,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: { orders },
              }),
            },
          ],
        };
      }

      case 'SALES_SUMMARY': {
        const { from, to, days, paymentProviderIds, deliveryProviderIds, status } = params;

        const analyticsResult = await orderModule.salesSummary({
          from,
          to,
          days,
          paymentProviderIds,
          deliveryProviderIds,
          status: status as any,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: analyticsResult,
              }),
            },
          ],
        };
      }

      case 'MONTHLY_BREAKDOWN': {
        const { from, to, paymentProviderIds, deliveryProviderIds, status } = params;

        const analyticsResult = await orderModule.monthlyBreakdown({
          from,
          to,
          paymentProviderIds,
          deliveryProviderIds,
          status: status as any,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: analyticsResult,
              }),
            },
          ],
        };
      }

      case 'TOP_CUSTOMERS': {
        const { limit, customerStatus, from, to } = params;

        const analyticsResult = await orderModule.topCustomers({
          limit,
          customerStatus,
          from,
          to,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: analyticsResult,
              }),
            },
          ],
        };
      }

      case 'TOP_PRODUCTS': {
        const { from, to, limit } = params;

        const analyticsResult = await orderModule.topProducts({
          from,
          to,
          limit,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: analyticsResult,
              }),
            },
          ],
        };
      }

      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error in order ${action.toLowerCase()}: ${(error as Error).message}`,
        },
      ],
    };
  }
}
