import { FastifyInstance, RouteHandlerMethod, FastifyRequest } from 'fastify';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {
  convertToModelMessages,
  experimental_createMCPClient as createMCPClient,
  MCPTransport,
  stepCountIs,
  streamText,
  ToolSet,
} from 'ai';
import generateImageHandler from '../chat/generateImageHandler.js';
import defaultSystemPrompt from '../chat/defaultSystemPrompt.js';
import normalizeToolsIndex from '../chat/normalizeToolsIndex.js';
import { ChatConfiguration, errorHandler } from '../chat/utils.js';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api:chat');

const setupMCPChatHandler = (chatConfiguration: ChatConfiguration & any) => {
  if (!chatConfiguration?.model) {
    throw new Error('Model is required');
  }

  const {
    tools: additionalTools = {},
    unchainedMCPUrl = `${process.env.ROOT_URL}/mcp`,
    imageGenerationTool,
    ...restChatConfig
  } = chatConfiguration;

  const system = chatConfiguration.system ?? defaultSystemPrompt;

  const mcpChatHandler: RouteHandlerMethod = async (req: FastifyRequest, res) => {
    let client;
    try {
      if (req.method === 'OPTIONS') {
        res.headers({
          'access-control-allow-credentials': 'true',
          'access-control-allow-private-network': 'true',
        });
        return res.status(200).send();
      }

      client = await createMCPClient({
        transport: new StreamableHTTPClientTransport(new URL(unchainedMCPUrl), {
          authProvider: null,
          requestInit: {
            headers: {
              Cookie: req.headers.cookie || '',
            },
          },
        }) as MCPTransport,
      });

      const defaultUnchainedTools = await client.tools();
      const tools: ToolSet = {
        ...defaultUnchainedTools,
        ...additionalTools,
      };
      if (imageGenerationTool) {
        tools.generateImage = generateImageHandler(req)(imageGenerationTool) as any;
      }

      if (req.method === 'GET') {
        return res.status(200).send({
          tools: normalizeToolsIndex(tools),
          cached: false,
        });
      }

      const { messages } = req.body as any;

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
      const result = streamText({
        stopWhen: stepCountIs(500),
        ...restChatConfig,
        messages: normalizedMessages,
        system,
        tools: cacheControlledTools,
        onFinish: async () => {
          await client?.close();
        },
        providerOptions: {
          anthropic: {
            cacheControl: {
              type: 'ephemeral'
            },
          },
        },
      });

      return res.send(
        result.toUIMessageStreamResponse({
          onError: errorHandler,
        }),
      );
    } catch (err: any) {
      logger.error(err);
      await client?.close();
      res.status(500);
      return res.send({ error: errorHandler(err) });
    }
  };
  return mcpChatHandler;
};

export const connectChat = (app: FastifyInstance, chatConfiguration: ChatConfiguration) => {
  const handler = setupMCPChatHandler(chatConfiguration);

  app.route({
    url: '/chat',
    method: ['POST', 'OPTIONS'],
    handler,
  });

  app.route({
    url: '/chat/tools',
    method: ['GET', 'OPTIONS'],
    handler,
  });
};
