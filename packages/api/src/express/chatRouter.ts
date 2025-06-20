import express from 'express';
import { Experimental_StdioMCPTransport as StdioMCPTransport } from 'ai/mcp-stdio';
import {
  experimental_createMCPClient as createMCPClient,
  InvalidToolArgumentsError,
  NoSuchToolError,
  ToolExecutionError,
  streamText,
} from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { defaultLogger } from '@unchainedshop/logger';

const chatRouter = express.Router();
const { CHAT_API_PATH = '/chat', ANTHROPIC_API_KEY, ROOT_URL = 'http://localhost:4010' } = process.env;

const errorHandler = (error: any): string => {
  if (NoSuchToolError.isInstance(error)) return 'NoSuchToolError';
  if (InvalidToolArgumentsError.isInstance(error)) return 'InvalidToolArgumentsError';
  if (ToolExecutionError.isInstance(error)) return 'ToolExecutionError';
  if (error?.message?.toLowerCase() === 'forbidden') return 'NetworkError';
  defaultLogger.error(error);
  return `Failed to stream response: ${error?.message || 'Unknown error'}`;
};

chatRouter.post(CHAT_API_PATH, async (req: any, res) => {
  const { messages } = req.body;
  if (!ANTHROPIC_API_KEY) {
    const logMessage =
      'ANTHROPIC_API_KEY environment variable is not set. Please set it to use the chat API.';
    defaultLogger.error(logMessage);
    res.status(503).json({
      error: {
        code: 'CHAT_API_UNAVAILABLE',
        message: 'Chat service temporarily unavailable. please try again letter',
      },
      id: null,
    });
    return;
  }

  let client;
  try {
    client = await createMCPClient({
      transport: new StdioMCPTransport({
        command: 'npx',
        args: ['-y', 'supergateway', '--streamableHttp', `${ROOT_URL}/mcp`],
        env: {},
      }),
    });

    const tools = await client.tools();

    const result = streamText({
      system:
        'do not include the data in your summary, just write a summary about it never list all the fields of a result, just summarize paragraph about your findings, if necessary',
      model: anthropic('claude-4-sonnet-20250514'),
      messages,
      maxTokens: 1000,
      maxSteps: 3,
      tools,
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
});

export default chatRouter;
