import express from 'express';
import type { Express, Request, RequestHandler, Response } from 'express';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  convertToModelMessages,
  experimental_createMCPClient as createMCPClient,
  MCPTransport,
  stepCountIs,
  streamText,
  ToolSet,
} from 'ai';
import { ChatConfiguration, errorHandler } from '../chat/utils.js';
import generateImageHandler from '../chat/generateImageHandler.js';
import defaultSystemPrompt from '../chat/defaultSystemPrompt.js';
import normalizeToolsIndex from '../chat/normalizeToolsIndex.js';

export const expressRouter = () => {
  const router = express.Router();

  const staticURL = import.meta.resolve('@unchainedshop/admin-ui');
  const staticPath = new URL(staticURL).pathname.split('/').slice(0, -1).join('/');

  router.use(express.static(staticPath));

  router.get(/(.*)/, (_, res) => {
    res.sendFile(`${staticPath}/index.html`);
  });

  return router;
};

const setupMCPChatHandler = (chatConfiguration: ChatConfiguration & any): RequestHandler => {
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

  const mcpChatHandler: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    if (req.method === 'OPTIONS') {
      res.setHeader('access-control-allow-credentials', 'true');
      res.setHeader('access-control-allow-private-network', 'true');
      res.status(200).end();
      return;
    }
    if (req.method !== 'POST' && req.method !== 'GET') {
      res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
      return;
    }
    const resourceTransport = new StreamableHTTPClientTransport(new URL(unchainedMCPUrl), {
      requestInit: {
        headers: {
          Cookie: req.headers.cookie || '',
        },
      },
    });

    const sdkClient = new Client(
      { name: 'unchained-chat-client', version: '1.0.0' },
      {
        capabilities: { resources: {} },
      },
    );
    await sdkClient.connect(resourceTransport as any);
    const transport = new StreamableHTTPClientTransport(new URL(unchainedMCPUrl), {
      requestInit: {
        headers: {
          Cookie: req.headers.cookie || '',
        },
      },
    });

    const client = await createMCPClient({
      transport: transport as MCPTransport,
    });

    try {
      const defaultUnchainedTools = await client.tools();
      let resourceContext = '';
      try {
        const resources = await sdkClient.listResources();
        if (resources?.resources) {
          const resourceTexts = await Promise.all(
            resources.resources.map(async (resource) => {
              try {
                const content = await sdkClient.readResource({ uri: resource.uri });
                if (content?.contents?.[0]?.text) {
                  return `${resource.name}:\n${content.contents[0].text}`;
                }
              } catch (e) {
                console.error(`Failed to read resource ${resource.uri}:`, e);
              }
              return null;
            }),
          );
          resourceContext =
            '\n\nAVAILABLE SHOP CONFIGURATION:\n' + resourceTexts.filter(Boolean).join('\n\n');
        }
      } catch (e) {
        console.error('Failed to fetch MCP resources:', e);
      }

      const tools: ToolSet = {
        ...defaultUnchainedTools,
        ...additionalTools,
      };
      if (imageGenerationTool) {
        tools.generateImage = generateImageHandler(req)(imageGenerationTool) as any;
      }

      if (req.method === 'GET') {
        res.status(200).json({
          tools: normalizeToolsIndex(tools),
          cached: false,
        });
        return;
      }
      const { messages } = req.body;

      const cacheControlledTools = { ...tools };
      const keys = Object.keys(cacheControlledTools);
      const lastKey = keys[keys.length - 1];

      cacheControlledTools[lastKey] = {
        ...cacheControlledTools[lastKey],
        providerOptions: {
          anthropic: { cacheControl: { type: 'ephemeral' } },
        },
      };

      const normalizedMessages = convertToModelMessages(messages, { tools: cacheControlledTools });

      if (normalizedMessages.length > 0) {
        const lastIndex = normalizedMessages.length - 1;
        normalizedMessages[lastIndex] = {
          ...normalizedMessages[lastIndex],
          providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
        };
      }

      const MAX_MESSAGES = 10;
      let startIndex = Math.max(0, normalizedMessages.length - MAX_MESSAGES);
      while (startIndex < normalizedMessages.length) {
        const msg = normalizedMessages[startIndex];
        const hasOrphanedToolResult =
          Array.isArray(msg.content) && msg.content.some((c: any) => c.type === 'tool-result');

        if (!hasOrphanedToolResult) break;
        startIndex++;
      }
      const messagesToInclude = normalizedMessages.slice(startIndex);

      const result = streamText({
        stopWhen: stepCountIs(10),
        temperature: 0.2,
        maxRetries: 3,
        ...restChatConfig,
        system: system + resourceContext,
        model,
        tools: cacheControlledTools,
        onFinish: async () => {
          await client?.close();
        },
        messages: messagesToInclude,
        providerOptions: {
          anthropic: {
            cacheControl: {
              type: 'ephemeral',
            },
          },
        },
      });

      result.pipeUIMessageStreamToResponse(res, {
        onError: errorHandler,
      });
    } catch (err) {
      await client?.close();
      await sdkClient?.close();
      res.status(500).json({ error: errorHandler(err) });
    }
  };

  return mcpChatHandler;
};

export const connectChat = (app: Express, chatConfiguration: ChatConfiguration) => {
  const handler = setupMCPChatHandler(chatConfiguration);
  if (!handler) {
    throw new Error('Invalid chat configuration: model is required.');
  }
  app.post('/chat', express.json({ limit: '10mb' }), handler);
  app.options('/chat', handler);
  app.get('/chat/tools', handler);
};
