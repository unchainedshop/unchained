import { Request, RequestHandler, Response } from 'express';
import {
  experimental_createMCPClient as createMCPClient,
  InvalidToolArgumentsError,
  NoSuchToolError,
  ToolExecutionError,
  streamText,
} from 'ai';
import { createLogger } from '@unchainedshop/logger';
import { Context } from '../context.js';
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

export const setupMCPChatHandler = (chatConfiguration) => {
  let client;
  if (!chatConfiguration || !chatConfiguration?.model) return null;
  const { tools = {}, ...restChatConfig } = chatConfiguration || {};

  const mcpChatHandler: RequestHandler = async (
    req: Request & { unchainedContext: Context },
    res: Response,
  ) => {
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
      return;
    }

    const { messages } = req.body;

    try {
      client = await createMCPClient({
        transport: new StreamableHTTPClientTransport(new URL(`${ROOT_URL}/mcp`)),
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

      result.pipeDataStreamToResponse(res, {
        getErrorMessage: errorHandler,
      });
    } catch (err) {
      await client?.close();
      res.status(500).json({ error: errorHandler(err) });
    }
  };

  return mcpChatHandler;
};
