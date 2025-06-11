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
import rateLimit from 'express-rate-limit';

// Define the rate limiter middleware
const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests to /chat. Please wait and try again later.',
  },
});

const chatRouter = express.Router();
const { CHAT_API_PATH = '/chat', ANTHROPIC_API_KEY, ROOT_URL = 'http://localhost:4010' } = process.env;

const rootUrl = ROOT_URL;
try {
  const url = new URL(rootUrl);
  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error('Configuration error: Invalid protocol');
} catch (error) {
  defaultLogger.error('Invalid ROOT_URL environment variable');
  throw error;
}

const errorHandler = (error: any): string => {
  if (NoSuchToolError.isInstance(error)) return 'NoSuchToolError';
  if (InvalidToolArgumentsError.isInstance(error)) return 'InvalidToolArgumentsError';
  if (ToolExecutionError.isInstance(error)) return 'ToolExecutionError';
  defaultLogger.error(error);
  return `Failed to stream response: ${error?.message || 'Unknown error'}`;
};

chatRouter.post(CHAT_API_PATH, chatRateLimiter, async (req, res) => {
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
        args: ['-y', 'supergateway', '--streamableHttp', `${rootUrl}/mcp`],
        env: {},
      }),
    });

    const tools = await client.tools();

    const result = streamText({
      model: anthropic('claude-4-sonnet-20250514'),
      messages,
      maxTokens: 1000,
      maxSteps: 1,
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
