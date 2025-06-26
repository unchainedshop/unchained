import { createLogger } from '@unchainedshop/logger';
import { Context } from '../context.js';
import { FastifyRequest, RouteHandlerMethod } from 'fastify';
import {
  experimental_createMCPClient as createMCPClient,
  InvalidToolArgumentsError,
  NoSuchToolError,
  ToolExecutionError,
  streamText,
} from 'ai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const logger = createLogger('unchained:mcp-chat-handler');

const { ROOT_URL } = process.env;

const errorHandler = (error: any): string => {
  if (NoSuchToolError.isInstance(error)) return 'NoSuchToolError';
  if (InvalidToolArgumentsError.isInstance(error)) return 'InvalidToolArgumentsError';
  if (ToolExecutionError.isInstance(error)) return 'ToolExecutionError';
  if (error?.message?.toLowerCase() === 'forbidden') return 'NetworkError';
  logger.error(error);
  return `Failed to stream response: ${error?.message || 'Unknown error'}`;
};

export default function setupMCPChatHandler(chatConfiguration) {
  let client;
  if (!chatConfiguration || !chatConfiguration?.model) return null;
  const { tools = {}, ...restChatConfig } = chatConfiguration || {};

  const mcpChatHandler: RouteHandlerMethod = async (
    req: FastifyRequest & { unchainedContext: Context },
    res,
  ) => {
    try {
      if (req.method === 'OPTIONS') return res.send();
      const { messages } = req.body as any;
      client = await createMCPClient({
        transport: new StreamableHTTPClientTransport(new URL(`${ROOT_URL}/mcp`), {
          requestInit: {
            headers: {
              Cookie: req.headers.cookie || '',
            },
          },
        }),
      });

      const defaultUnchainedTools = await client.tools();

      const result = streamText({
        ...restChatConfig,
        messages,
        tools: { ...defaultUnchainedTools, ...tools },
        onFinish: async () => {
          await client?.close();
        },
      });

      res.header('X-Vercel-AI-Data-Stream', 'v1');
      res.header('Content-Type', 'text/plain; charset=utf-8');
      return res.send(
        result.toDataStream({
          getErrorMessage: errorHandler,
        }),
      );
    } catch (e) {
      logger.error(e.message);
      res.status(503);
      return res.send(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
    }
  };

  return mcpChatHandler;
}
