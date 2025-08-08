import { z } from 'zod';

export const OrderFilterSchema = {
  paymentProviderIds: z.array(z.string()).optional(),
  deliveryProviderIds: z.array(z.string()).optional(),
  status: z.array(z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])).optional(),
};

export const DateRangeSchema = {
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
};
