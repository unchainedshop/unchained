import handleWebhook from './handle-webhook.js';

const cryptopayHandler = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await handleWebhook(req.body, req.unchainedContext);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
      return;
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, error: e.message }));
      return;
    }
  }
  res.writeHead(404);
  res.end(JSON.stringify({ success: false }));
};

export default cryptopayHandler;
