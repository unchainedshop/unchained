import type { Express } from 'express';
import { createServerAdapter } from '@whatwg-node/server';
import { ticketingRoutes } from './routes.ts';

export default (app: Express) => {
  for (const route of ticketingRoutes) {
    // Create WHATWG-compliant server adapter
    const adapter = createServerAdapter(async (request: Request, serverContext: any) => {
      const context = {
        ...serverContext.unchainedContext,
        params: serverContext.params || {},
      };

      return await route.handler(request, context);
    });

    // Mount the route - use wildcard for paths with /*
    const expressPath = route.path.replace(/\/\*$/, '/*');

    app.use(expressPath, async (req, res) => {
      try {
        // Use handleNodeRequestAndResponse - properly converts Node.js IncomingMessage to WHATWG Request
        // and automatically sends the response
        await adapter.handleNodeRequestAndResponse(req, res, {
          unchainedContext: (req as any).unchainedContext,
          params: req.params,
        } as any);
      } catch {
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }
    });
  }
};
