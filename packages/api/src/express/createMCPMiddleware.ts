import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import createMcpServer from '../mcp/index.js';
import { Request, RequestHandler } from 'express';
import { createLogger } from '@unchainedshop/logger';
import { Context } from '../context.js';

const logger = createLogger('unchained:mcp');

// Map to store transports by session ID
const transports: Record<string, StreamableHTTPServerTransport> = {};

const handlePostRequest: RequestHandler = async (req: Request & { unchainedContext: Context }, res) => {
  // Check for existing session ID

  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  let transport: StreamableHTTPServerTransport;

  logger.info('Received request', {
    method: req.method,
    url: req.url,
    headers: req.headers,
  });

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        transports[sessionId] = transport;
      },
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };
    const server = createMcpServer(req.unchainedContext);
    await server.connect(transport);
  } else {
    // Invalid request
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }

  // Handle the request
  await transport.handleRequest(req, res, req.body);
};

// Reusable handler for GET and DELETE requests
const handleSessionRequest: RequestHandler = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

const createMCPMiddleware: RequestHandler = (req, res, next) => {
  console.log(req.method, req.headers);
  if (req.method === 'POST') {
    return handlePostRequest(req, res, next);
  } else if (req.method === 'GET' || req.method === 'DELETE') {
    return handleSessionRequest(req, res, next);
  }
  res.status(405).send('Method Not Allowed');
};

export default createMCPMiddleware;
