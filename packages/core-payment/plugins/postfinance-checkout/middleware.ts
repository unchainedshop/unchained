import bodyParser from 'body-parser';
import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import { Context } from '@unchainedshop/types/api';
import { WebhookData } from './types';

const { PFCHECKOUT_WEBHOOK_PATH = '/graphql/postfinance-checkout' } = process.env;

useMiddlewareWithCurrentContext(PFCHECKOUT_WEBHOOK_PATH, bodyParser.json());

useMiddlewareWithCurrentContext(PFCHECKOUT_WEBHOOK_PATH, async (request, response) => {
  const resolvedContext = request.unchainedContext as Context;
  const data = request.body as WebhookData;
});
