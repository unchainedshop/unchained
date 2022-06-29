import { PaymentDirector, PaymentAdapter, PaymentError } from '@unchainedshop/core-payment';

import { IPaymentAdapter } from '@unchainedshop/types/payments';
import { createLogger } from '@unchainedshop/logger';

import { OrderPricingSheet } from '@unchainedshop/core-orders';
import bodyParser from 'body-parser';
import { acl, roles, useMiddlewareWithCurrentContext } from '@unchainedshop/api';
import crypto from 'crypto';
import fetch from 'isomorphic-unfetch';
import ClientOAuth2 from '@unchainedshop/client-oauth2';
import { Context } from '@unchainedshop/types/api';
import { BityModule } from './module/configureBityModule';

const logger = createLogger('unchained:core-payment:bity');

const { checkAction } = acl;
const { actions } = roles;

let currentToken;

const {
  BITY_CLIENT_ID,
  BITY_CLIENT_SECRET,
  BITY_BANK_ACCOUNT_IBAN,
  BITY_BANK_ACCOUNT_ADDRESS,
  BITY_BANK_ACCOUNT_CITY,
  BITY_BANK_ACCOUNT_COUNTRY,
  BITY_BANK_ACCOUNT_NAME,
  BITY_BANK_ACCOUNT_ZIP,
  BITY_API_ENDPOINT = 'https://exchange.api.bity.com',
  BITY_OAUTH_INIT_PATH = '/graphql/bity-auth',
  BITY_OAUTH_REDIRECT_URI = 'http://localhost:4010/graphql/bity',
  BITY_OAUTH_STATE = 'unchained',
  BITY_OAUTH_PATH = '/graphql/bity',
} = process.env;

const createBityAuth = () => {
  if (!BITY_CLIENT_ID) throw new Error('Bity plugin is not setup');

  return new ClientOAuth2({
    clientId: BITY_CLIENT_ID,
    clientSecret: BITY_CLIENT_SECRET,
    accessTokenUri: 'https://connect.bity.com/oauth2/token',
    authorizationUri: 'https://connect.bity.com/oauth2/auth',
    redirectUri: BITY_OAUTH_REDIRECT_URI,
    state: BITY_OAUTH_STATE,
    scopes: [
      'https://auth.bity.com/scopes/exchange.place',
      'https://auth.bity.com/scopes/exchange.history',
      'offline_access',
    ],
    sendClientCredentialsInBody: true,
  });
};

const upsertBityCredentials = async (user, context: Context) => {
  currentToken = user;

  const iv = crypto.randomBytes(16);
  const key = crypto
    .createHash('sha256')
    .update(String(BITY_CLIENT_SECRET))
    .digest('base64')
    .substring(0, 32);

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(JSON.stringify(user.data));
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const externalId = `${BITY_CLIENT_ID}-${BITY_OAUTH_REDIRECT_URI}-${BITY_OAUTH_STATE}`;
  const doc = {
    externalId,
    data: {
      iv: iv.toString('hex'),
      encryptedData: encrypted.toString('hex'),
    },
    expires: user.expires,
  };

  const bityModule = (context.modules as any).bity as BityModule;
  await bityModule.upsertCredentials(doc, context.userId);
};

const getTokenFromDb = async (bityAuth, context: Context) => {
  const bityModule = (context.modules as any).bity as BityModule;
  const credentials = await bityModule.findBityCredentials({
    externalId: `${BITY_CLIENT_ID}-${BITY_OAUTH_REDIRECT_URI}-${BITY_OAUTH_STATE}`,
  });
  if (!credentials?.data) return null;

  const iv = Buffer.from(credentials.data.iv, 'hex');
  const encryptedText = Buffer.from(credentials.data.encryptedData, 'hex');
  const key = crypto
    .createHash('sha256')
    .update(String(BITY_CLIENT_SECRET))
    .digest('base64')
    .substr(0, 32);

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  const data = JSON.parse(decrypted.toString());

  const token = bityAuth.createToken(data.access_token, data.refresh_token, data.token_type, { data });
  return token;
};

const refreshBityUser = async (context: Context) => {
  if (currentToken) {
    const newToken = await currentToken.refresh();
    if (newToken) {
      await upsertBityCredentials(newToken, context);
    }
  }
};

const signPayload = (...args) => {
  const resultString = args.filter(Boolean).join('');
  const signKeyInBytes = Buffer.from(BITY_CLIENT_ID, 'hex');

  const signedString = crypto.createHmac('sha256', signKeyInBytes).update(resultString).digest('hex');
  return signedString;
};

const bityExchangeFetch = async (params: { path: string; data?: any }, context: Context) => {
  const body = params.data && JSON.stringify(params.data);
  const doFetch = async () => {
    const response = await fetch(`${BITY_API_ENDPOINT}${params.path}`, {
      method: body ? 'POST' : 'GET',
      body: body || undefined,
      headers: {
        Authorization: `Bearer ${currentToken.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    return response;
  };
  const response = await doFetch();
  if (response.status === 401) {
    await refreshBityUser(context);
    return doFetch();
  }
  return response;
};

const createBityOrder = async (data: any, context: Context) => {
  const response = await bityExchangeFetch(
    {
      path: '/v2/orders',
      data,
    },
    context,
  );

  if (response?.status !== 201) {
    logger.error('Bity Plugin: Response invalid', {
      data,
      route: '/orders',
      response,
    });
    throw new Error('Could not create Bity Order');
  }
  return response.headers.get('Location');
};

// eslint-disable-next-line
const estimateBityOrder = async (data: any, context: Context) => {
  const response = await bityExchangeFetch(
    {
      path: '/v2/orders/estimate',
      data,
    },
    context,
  );

  if (response?.status !== 200) {
    logger.error('Bity Plugin: Response invalid', {
      data,
      route: '/orders/estimate',
      response,
    });
    throw new Error('Could not estimate Bity Currency Conversion');
  }
  return response.json();
};

useMiddlewareWithCurrentContext(BITY_OAUTH_INIT_PATH, async (req, res) => {
  if (req.method === 'GET') {
    try {
      const resolvedContext = req.unchainedContext;
      await checkAction(resolvedContext, actions.managePaymentProviders);

      const bityAuthClient = createBityAuth();
      const uri = bityAuthClient.code.getUri();
      logger.info(`Bity Webhook: Login ${uri}`);
      res.writeHead(302, {
        Location: uri,
      });
      res.end();
      return;
    } catch (e) {
      logger.warn(`Bity Webhook: Failed with ${e.message}`);
      res.writeHead(503);
      res.end(JSON.stringify(e));
      return;
    }
  }
  res.writeHead(404);
  res.end();
});

useMiddlewareWithCurrentContext(BITY_OAUTH_PATH, async (req, res, next) => {
  bodyParser.urlencoded({ extended: false })(req, res, next);
});

useMiddlewareWithCurrentContext(BITY_OAUTH_PATH, async (req, res) => {
  if (req.method === 'GET') {
    try {
      const resolvedContext = req.unchainedContext as Context;
      await checkAction(resolvedContext, actions.managePaymentProviders);
      const bityAuthClient = createBityAuth();
      const user = await bityAuthClient.code.getToken(req.originalUrl);
      await upsertBityCredentials(user, resolvedContext);
      res.writeHead(200);
      res.end('Bity Credentials Setup Complete');
      return;
    } catch (e) {
      logger.warn(`Bity Webhook: Failed with ${e.message}`);
      res.writeHead(503);
      res.end(JSON.stringify(e));
      return;
    }
  }
  res.writeHead(404);
  res.end();
});

let bityAuthClient;
const loadToken = async (context: Context) => {
  if (currentToken) return currentToken;

  if (!bityAuthClient) {
    bityAuthClient = createBityAuth();
  }

  if (bityAuthClient) {
    currentToken = await getTokenFromDb(bityAuthClient, context);
  }

  return currentToken;
};

let token;

const Bity: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.payment.bity',
  label: 'Bity',
  version: '1.0',

  initialConfiguration: [],

  typeSupported: (type) => {
    return type === 'GENERIC';
  },

  actions: (params) => {
    loadToken(params.context).then((t) => {
      token = t;
    });
    const adapter = {
      ...PaymentAdapter.actions(params),

      configurationError: () => {
        if (!token) {
          return PaymentError.INCOMPLETE_CONFIGURATION;
        }
        return null;
      },

      isActive: () => {
        if (adapter.configurationError() === null) return true;
        return false;
      },

      isPayLaterAllowed() {
        return false;
      },

      sign: async (transactionContext = {}) => {
        // Signing the order will estimate a new order in bity and sign it with private data
        logger.info(`Bity Plugin: Sign ${JSON.stringify(transactionContext)}`);

        const { orderPayment } = params.paymentContext;

        const order = await params.context.modules.orders.findOrder({
          orderId: orderPayment.orderId,
        });
        const pricing = OrderPricingSheet({
          calculation: order.calculation,
          currency: order.currency,
        });

        if (!pricing) {
          throw new Error('Price calculation of order invalid');
        }

        const totalAmount = Math.round(pricing.total({ useNetPrice: false }).amount / 10 || 0) * 10;

        const payload = await estimateBityOrder(
          {
            output: {
              currency: 'EUR',
              amount: `${totalAmount / 100}`,
            },
            input: {
              currency: 'BTC',
            },
          },
          params.context,
        );

        const signature = signPayload(
          JSON.stringify(payload),
          order._id,
          totalAmount,
          BITY_CLIENT_SECRET,
        );

        return JSON.stringify({
          payload,
          signature,
        });
      },

      charge: async () => {
        const { order } = params.paymentContext;
        const { bityPayload, bitySignature } = order?.context || {};

        const pricing = OrderPricingSheet({
          calculation: order.calculation,
          currency: order.currency,
        });

        if (!pricing) {
          throw new Error('Price calculation of order invalid');
        }

        const totalAmount =
          Math.round(
            pricing.total({
              useNetPrice: false,
            }).amount / 10 || 0,
          ) * 10;

        const signature = signPayload(
          JSON.stringify(bityPayload),
          order._id,
          totalAmount,
          BITY_CLIENT_SECRET,
        );
        if (bitySignature !== signature) {
          logger.warn(`Bity Plugin: Signature Mismatch ${JSON.stringify(bityPayload)} ${bitySignature}`);
          throw new Error('Signature Mismatch');
        }

        const path = await createBityOrder(
          {
            input: {
              amount: bityPayload.input.amount,
              currency: bityPayload.input.currency,
            },
            output: {
              currency: bityPayload.output.currency,
              type: 'bank_account',
              iban: BITY_BANK_ACCOUNT_IBAN,
              reference: order._id,
              owner: {
                address: BITY_BANK_ACCOUNT_ADDRESS,
                city: BITY_BANK_ACCOUNT_CITY,
                country: BITY_BANK_ACCOUNT_COUNTRY,
                name: BITY_BANK_ACCOUNT_NAME,
                zip: BITY_BANK_ACCOUNT_ZIP,
              },
            },
          },
          params.context,
        );

        logger.info(`Bity Plugin: Prepared Bity Order`, path);
        const response = await bityExchangeFetch({ path }, params.context);

        const bityOrder = await response?.json();
        if (!bityOrder) {
          logger.warn(`Bity Plugin: Bity Order not found ${JSON.stringify(path)} ${bitySignature}`);
          throw new Error('Bity Order not Found');
        }

        await params.context.modules.orders.updateContext(
          order._id,
          {
            bityOrder,
          },
          params.context,
        );

        return false;
      },
    };

    return adapter;
  },
};

PaymentDirector.registerAdapter(Bity);
