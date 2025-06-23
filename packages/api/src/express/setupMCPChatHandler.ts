import { UnchainedCore } from '@unchainedshop/core';
import { Experimental_StdioMCPTransport as StdioMCPTransport } from 'ai/mcp-stdio';
import { Request, RequestHandler, Response } from 'express';
import {
  experimental_createMCPClient as createMCPClient,
  InvalidToolArgumentsError,
  NoSuchToolError,
  ToolExecutionError,
  streamText,
} from 'ai';
import { defaultLogger } from '@unchainedshop/logger';

const { ROOT_URL } = process.env;
const errorHandler = (error: any): string => {
  if (NoSuchToolError.isInstance(error)) return 'NoSuchToolError';
  if (InvalidToolArgumentsError.isInstance(error)) return 'InvalidToolArgumentsError';
  if (ToolExecutionError.isInstance(error)) return 'ToolExecutionError';
  if (error?.message?.toLowerCase() === 'forbidden') return 'NetworkError';
  defaultLogger.error(error);
  return `Failed to stream response: ${error?.message || 'Unknown error'}`;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const setupMCPChatHandler = async (chatConfiguration, context: UnchainedCore) => {
  let client;
  if (!chatConfiguration) return null;
  const { tools = {}, ...restChatConfig } = chatConfiguration || {};
  const mcpChatHandler: RequestHandler = async (req: Request, res: Response) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
      return null;
    }

    const { messages } = req.body;

    try {
      client = await createMCPClient({
        transport: new StdioMCPTransport({
          command: 'npx',
          args: ['-y', 'supergateway', '--streamableHttp', `${ROOT_URL}/mcp`],
          env: {},
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
