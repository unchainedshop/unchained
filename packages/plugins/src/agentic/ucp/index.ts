import { createHash } from 'node:crypto';
import type { IPlugin, PluginHttpRequestContext } from '@unchainedshop/core';
import {
  cancelCheckout,
  completeCheckout,
  createCheckout,
  getCheckout,
  updateCheckout,
} from './checkout.ts';
import { continueHandler, rootUrl } from './handoff.ts';
import { ucpRoute } from './http.ts';
import { configureUcpModule } from './module.ts';
import { getOrder } from './order.ts';
import { configuredHandlers, handlerDeclarations, handlersFor } from './payment.ts';
import type { UcpPluginOptions } from './platform.ts';
import { profileCapabilities, profileServices, UCP_VERSION } from './protocol.ts';
import { signingKey } from './signature.ts';
import { UcpWebhookWorker, subscribeOrderWebhooks } from './worker.ts';

export { invoiceHandler, type UcpPaymentHandler } from './payment.ts';
export type { UcpPlatform, UcpPluginOptions } from './platform.ts';
export type { UcpModule } from './module.ts';
export { UCP_VERSION } from './protocol.ts';

const profileHandler =
  (options: UcpPluginOptions) => async (request: Request, context: PluginHttpRequestContext) => {
    const providers = await context.modules.payment.paymentProviders.allProviders();
    const key = signingKey();
    const body = JSON.stringify({
      ucp: {
        version: UCP_VERSION,
        services: profileServices(`${rootUrl()}${options.basePath ?? '/ucp'}`),
        capabilities: profileCapabilities(),
        payment_handlers: handlerDeclarations(handlersFor(configuredHandlers(options), providers)),
      },
      ...(key ? { keys: [key.jwk] } : {}),
    });
    const etag = `"${createHash('sha256').update(body).digest('base64url')}"`;
    const headers = { 'content-type': 'application/json', 'cache-control': 'public, max-age=300', etag };
    if (request.headers.get('if-none-match') === etag)
      return new Response(null, { status: 304, headers });
    return new Response(body, { headers });
  };

export function createUcpPlugin(options: UcpPluginOptions = {}): IPlugin {
  const sessions = `${options.basePath ?? '/ucp'}/checkout-sessions`;
  return {
    key: 'shop.unchained.ucp',
    label: 'Universal Commerce Protocol',
    version: '1.0.0',

    module: ({ db }) => ({ ucp: configureUcpModule({ db }) }),

    adapters: [UcpWebhookWorker],

    routes: [
      { path: '/.well-known/ucp', method: 'GET', handler: profileHandler(options) },
      { path: sessions, method: 'POST', handler: ucpRoute(options, 'create', createCheckout) },
      { path: `${sessions}/:id`, method: 'GET', handler: ucpRoute(options, 'get', getCheckout) },
      { path: `${sessions}/:id`, method: 'PUT', handler: ucpRoute(options, 'update', updateCheckout) },
      {
        path: `${sessions}/:id/complete`,
        method: 'POST',
        handler: ucpRoute(options, 'complete', completeCheckout),
      },
      {
        path: `${sessions}/:id/cancel`,
        method: 'POST',
        handler: ucpRoute(options, 'cancel', cancelCheckout),
      },
      { path: `${sessions}/:id/continue/:token`, method: 'GET', handler: continueHandler(options) },
      {
        path: `${options.basePath ?? '/ucp'}/orders/:id`,
        method: 'GET',
        handler: ucpRoute(options, 'order', getOrder),
      },
    ],

    onRegister: (unchainedAPI) => {
      subscribeOrderWebhooks(unchainedAPI, options);
    },
  };
}

export default createUcpPlugin;
