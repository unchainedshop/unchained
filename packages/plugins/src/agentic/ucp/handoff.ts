import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PluginHttpRequestContext } from '@unchainedshop/core';
import type { Order } from '@unchainedshop/core-orders';
import type { UcpContext } from './http.ts';
import type { UcpPluginOptions } from './platform.ts';
import { expiresAt, isClosed } from './status.ts';

export const rootUrl = () => (process.env.ROOT_URL || 'http://localhost:4010').replace(/\/+$/, '');

const websiteUrl = () => (process.env.EMAIL_WEBSITE_URL || rootUrl()).replace(/\/+$/, '');

export const orderUrl = (options: UcpPluginOptions, order: Order) =>
  options.orderUrl?.(order) ?? `${websiteUrl()}/order?_id=${order._id}`;

const sign = (orderId: string, expires: number) =>
  createHmac('sha256', process.env.UNCHAINED_TOKEN_SECRET!)
    .update(`ucp-continue|${orderId}|${expires}`)
    .digest('base64url');

export function continueUrl({ basePath = '/ucp' }: UcpPluginOptions, order: Order) {
  const expires = Math.floor(expiresAt(order).getTime() / 1000);
  return `${rootUrl()}${basePath}/checkout-sessions/${order._id}/continue/${expires}.${sign(order._id, expires)}`;
}

const isValidToken = (orderId: string, token: string) => {
  const [expires, signature = ''] = token.split('.');
  const expected = Buffer.from(sign(orderId, Number(expires)));
  const received = Buffer.from(signature);
  return (
    Number(expires) * 1000 > Date.now() &&
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
};

export const continueHandler =
  (options: UcpPluginOptions) => async (request: Request, pluginContext: PluginHttpRequestContext) => {
    const context = pluginContext as UcpContext;
    const { id, token } = context.params;
    const order = isValidToken(id, token)
      ? await context.modules.orders.findOrder({ orderId: id })
      : null;
    if (!order?.context?.ucp || isClosed(order)) {
      return new Response('This checkout is no longer available', {
        status: 404,
        headers: { 'cache-control': 'no-store' },
      });
    }
    const user = await context.modules.users.findUserById(order.userId);
    if (user?.guest) await context.login(user);
    return new Response(null, {
      status: 303,
      headers: {
        location: options.checkoutUrl?.(order._id) ?? `${websiteUrl()}/checkout`,
        'referrer-policy': 'no-referrer',
        'cache-control': 'no-store',
      },
    });
  };
