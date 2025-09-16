import express from 'express';
import type { Express, Request, RequestHandler, Response } from 'express';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import path from 'node:path';
import {
  convertToModelMessages,
  experimental_createMCPClient as createMCPClient,
  MCPTransport,
  stepCountIs,
  streamText,
  ToolSet,
} from 'ai';
import { ChatConfiguration, errorHandler } from './utils';
import generateImageHandler from './generateImageHandler';
import defaultSystemPrompt from './defaultSystemPrompt';
import normalizeToolsIndex from './normalizeToolsIndex';

export const expressRouter = express.Router();
const staticPath = path.join(__dirname, '..', 'out');

expressRouter.use(express.static(staticPath));

expressRouter.get(/(.*)/, (_, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

const setupMCPChatHandler = (
  chatConfiguration: ChatConfiguration & any,
): RequestHandler => {
  if (!chatConfiguration || !chatConfiguration.model) {
    throw new Error('Model is required');
  }

  const {
    tools: additionalTools = {},
    unchainedMCPUrl = `${process.env.ROOT_URL}/mcp`,
    model,
    imageGenerationTool,
    ...restChatConfig
  }: any = chatConfiguration;

  const system = chatConfiguration.system ?? defaultSystemPrompt;

  const mcpChatHandler: RequestHandler = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    if (req.method !== 'POST' && req.method !== 'GET') {
      res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
      return;
    }

    const client = await createMCPClient({
      transport: new StreamableHTTPClientTransport(new URL(unchainedMCPUrl), {
        requestInit: {
          headers: {
            Cookie: req.headers.cookie || '',
          },
        },
      }) as MCPTransport,
    });

    try {
      const defaultUnchainedTools = await client.tools();
      const tools: ToolSet = {
        ...defaultUnchainedTools,
        ...additionalTools,
      };
      if (imageGenerationTool) {
        tools.generateImage = generateImageHandler(req)(
          imageGenerationTool,
        ) as any;
      }

      if (req.method === 'GET') {
        res.status(200).json({
          tools: normalizeToolsIndex(tools),
          cached: false,
        });
        return;
      }
      const { messages } = req.body;
      const result = streamText({
        stopWhen: stepCountIs(10),
        ...restChatConfig,
        system,
        model,
        messages: convertToModelMessages(messages, {
          tools,
          ignoreIncompleteToolCalls: true,
        }),
        tools,
        onFinish: async () => {
          await client?.close();
        },
      });

      result.pipeUIMessageStreamToResponse(res, {
        onError: errorHandler,
      });
    } catch (err) {
      await client?.close();
      res.status(500).json({ error: errorHandler(err) });
    }
  };

  return mcpChatHandler;
};

export const connectChat = (
  app: Express,
  chatConfiguration: ChatConfiguration,
) => {
  const handler = setupMCPChatHandler(chatConfiguration);
  if (!handler) {
    throw new Error('Invalid chat configuration: model is required.');
  }
  app.post('/chat', express.json({ limit: '10mb' }), handler);
  app.options('/chat', handler);
  app.get('/chat/tools', handler);
};
