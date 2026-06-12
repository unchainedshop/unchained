import type { Stripe } from 'stripe';
import { stripe, stripeEnvironment } from './stripe.ts';

export interface StripeUserData {
  userId: string;
  name?: string;
  email?: string;
}

export const upsertCustomer = async (
  { userId, name, email }: StripeUserData,
  stripeClient: Stripe = stripe,
): Promise<string> => {
  try {
    const { data } = await stripeClient.customers.search({
      query: `metadata["userId"]:"${userId}"`,
    });
    const existingCustomer = data[0];

    if (
      existingCustomer.name !== name ||
      existingCustomer.email !== email ||
      existingCustomer.metadata.environment !== stripeEnvironment
    ) {
      const updatedCustomer = await stripeClient.customers.update(existingCustomer.id, {
        metadata: {
          userId,
          environment: stripeEnvironment,
        },
        name,
        email,
      });
      return updatedCustomer.id;
    }

    return existingCustomer.id;
  } catch {
    const customer = await stripeClient.customers.create({
      metadata: {
        userId,
        environment: stripeEnvironment,
      },
      name,
      email,
    });
    return customer.id;
  }
};
