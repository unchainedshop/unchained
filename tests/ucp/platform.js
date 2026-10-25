import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { getServerBaseUrl } from '../helpers.js';
import { createSigner, signRequest } from './crypto.js';

export const VERSION = '2026-08-25';
export const CHECKOUT = 'dev.ucp.shopping.checkout';
export const FULFILLMENT = 'dev.ucp.shopping.fulfillment';
export const DISCOUNT = 'dev.ucp.shopping.discount';
export const ORDER = 'dev.ucp.shopping.order';
export const INVOICE = 'shop.unchained.payment.invoice';

const SPEC_PATHS = {
  [CHECKOUT]: ['shopping/checkout', 'shopping/checkout.json'],
  [FULFILLMENT]: ['shopping/extensions/fulfillment', 'shopping/fulfillment.json'],
  [DISCOUNT]: ['shopping/extensions/discount', 'shopping/discount.json'],
  [ORDER]: ['shopping/order', 'shopping/order.json'],
};

export async function startFakePlatform() {
  const signer = createSigner();
  const routes = new Map();
  const server = createServer((request, response) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      const route = routes.get(request.url);
      if (!route) {
        response.writeHead(404);
        response.end();
        return;
      }
      if (route.received) {
        route.received.push({
          url: `${origin}${request.url}`,
          headers: request.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        });
        response.writeHead(route.statuses.shift() ?? 200);
        response.end();
        return;
      }
      response.writeHead(route.status ?? 200, {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=60',
        ...route.headers,
      });
      response.end(route.body);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;

  const serve = (route) => {
    const path = `/raw/${randomUUID()}`;
    routes.set(path, route);
    return `${origin}${path}`;
  };

  const webhook = (statuses = []) => {
    const path = `/webhooks/${randomUUID()}`;
    const route = { received: [], statuses };
    routes.set(path, route);
    return { url: `${origin}${path}`, received: route.received };
  };

  const profile = ({
    capabilities = [CHECKOUT, FULFILLMENT, DISCOUNT],
    handlers = [],
    version = VERSION,
    webhookUrl,
  } = {}) => {
    const document = {
      ucp: {
        version,
        services: {
          'dev.ucp.shopping': [
            {
              version,
              spec: `https://ucp.dev/${VERSION}/specification/overview`,
              transport: 'rest',
              schema: `https://ucp.dev/${VERSION}/services/shopping/rest.openapi.json`,
              endpoint: `${origin}/ucp`,
            },
          ],
        },
        capabilities: Object.fromEntries(
          capabilities.map((name) => [
            name,
            [
              {
                version,
                spec: `https://ucp.dev/${VERSION}/specification/${SPEC_PATHS[name][0]}`,
                schema: `https://ucp.dev/${VERSION}/schemas/${SPEC_PATHS[name][1]}`,
                ...(name === FULFILLMENT || name === DISCOUNT ? { extends: CHECKOUT } : {}),
                ...(name === ORDER && webhookUrl ? { config: { webhook_url: webhookUrl } } : {}),
              },
            ],
          ]),
        ),
        payment_handlers: Object.fromEntries(
          handlers.map((name) => [
            name,
            [
              {
                id: `${name}-platform`,
                version: '2026-10-20',
                spec: 'https://docs.unchained.shop/ai-integration/ucp',
                schema: 'https://unchained.shop/ucp/handler.json',
              },
            ],
          ]),
        ),
      },
      keys: [signer.jwk],
    };
    return { url: serve({ body: JSON.stringify(document) }), document };
  };

  const client =
    (profileUrl, { token, signed = false } = {}) =>
    async (method, path, body, { key = randomUUID(), headers = {}, sign: signOptions } = {}) => {
      const url = `${getServerBaseUrl()}/ucp${path}`;
      const raw = body === undefined ? undefined : JSON.stringify(body);
      let requestHeaders = {
        'ucp-agent': `profile="${profileUrl}"`,
        ...(raw === undefined ? {} : { 'content-type': 'application/json' }),
        ...(method !== 'GET' && key ? { 'idempotency-key': key } : {}),
        ...(token ? { authorization: token } : {}),
        ...headers,
      };
      if (signed || signOptions) {
        requestHeaders = signRequest(
          signer,
          { method, url, headers: requestHeaders, body: raw },
          signOptions,
        );
      }
      const response = await fetch(url, { method, headers: requestHeaders, body: raw });
      const text = await response.text();
      return {
        status: response.status,
        headers: response.headers,
        body: text ? JSON.parse(text) : null,
      };
    };

  return {
    origin,
    signer,
    serve,
    webhook,
    profile,
    client,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

export const waitFor = async (check, { tries = 100, interval = 100 } = {}) => {
  for (let attempt = 0; attempt < tries; attempt += 1) {
    const result = await check();
    if (result) return result;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error('Condition not met in time');
};
