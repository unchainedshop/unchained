import { createLogger } from '@unchainedshop/logger';
import handleWebhook from './handle-webhook.ts';

const logger = createLogger('unchained:cryptopay:handler');

const cryptopayHandler = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await handleWebhook(req.body, req.unchainedContext);
      res.status(200).send({ success: true });
      return;
    } catch (e) {
      logger.error(e);
      res.status(500).send({ success: false, error: e.message });
      return;
    }
  }
  res.status(404).send();
};

export default cryptopayHandler;
