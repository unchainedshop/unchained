import e from 'express';
import { acpConfig } from '../acp/config.ts';
import { handleACPRequest } from '../acp/handler.ts';

export const createACPMiddleware = e.Router();

createACPMiddleware.use(e.json({ limit: '1mb' }));
createACPMiddleware.all(/(.*)/, async (req, res) => {
  const response = await handleACPRequest({
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body,
    context: (req as any).unchainedContext,
  });
  Object.entries(response.headers || {}).forEach(([name, value]) => res.setHeader(name, value));
  if (response.contentType) {
    res.type(response.contentType).status(response.status).send(response.body);
  } else {
    res.status(response.status).json(response.body);
  }
});

export const wellKnownACPHandler = (_req: e.Request, res: e.Response) => {
  res.json({
    protocol: 'agentic-commerce-protocol',
    api_versions: ['2026-04-17'],
    checkout_endpoint: `${acpConfig.apiPath}/checkout_sessions`,
    capabilities: ['checkout', 'stripe_spt'],
  });
};
