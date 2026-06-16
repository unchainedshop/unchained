import type { FastifyInstance, RouteHandlerMethod, FastifyRequest } from 'fastify';
import type * as aiTypes from 'ai';
import type * as mcpTypes from '@ai-sdk/mcp';
import generateImageHandler from '../chat/generateImageHandler.ts';
import defaultSystemPrompt from '../chat/defaultSystemPrompt.ts';
import normalizeToolsIndex from '../chat/normalizeToolsIndex.ts';
import { type ChatConfiguration, errorHandler } from '../chat/utils.ts';
import { connectMCPServers, type MCPServerConfig } from '../chat/connectMCPServers.ts';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api:chat');

let convertToModelMessages: typeof aiTypes.convertToModelMessages;
let stepCountIs: typeof aiTypes.stepCountIs;
let streamText: typeof aiTypes.streamText;
let createMCPClient: typeof mcpTypes.createMCPClient;

try {
  const aiTools = await import('ai');
  const mcpTools = await import('@ai-sdk/mcp');

  convertToModelMessages = aiTools.convertToModelMessages;
  stepCountIs = aiTools.stepCountIs;
  streamText = aiTools.streamText;
  createMCPClient = mcpTools.createMCPClient;
} catch {
  logger.warn(`optional peer npm packages 'ai' and '@ai-sdk/mcp' not installed, chat will not work`);
}

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
    let closeAll: (() => Promise<void>) | undefined;
    try {
      if (req.method === 'OPTIONS') {
        res.headers({
          'access-control-allow-credentials': 'true',
          'access-control-allow-private-network': 'true',
        });
        return res.status(200).send();
      }

      const body = req.body as any;
      const extraMCPServers: MCPServerConfig[] = body?.mcpServers || [];

      const serverConfigs: MCPServerConfig[] = [
        { url: unchainedMCPUrl, name: 'unchained' },
        ...extraMCPServers,
      ];

      const requestHeaders: Record<string, string> = {
        Cookie: req.headers.cookie || '',
      };

      const connection = await connectMCPServers(serverConfigs, requestHeaders);
      closeAll = connection.closeAll;

      const tools: aiTypes.ToolSet = {
        ...connection.tools,
        ...additionalTools,
      };
      if (imageGenerationTool) {
        tools.generateImage = generateImageHandler(req)(imageGenerationTool) as any;
      }

      if (req.method === 'GET') {
        await closeAll();
        return res.status(200).send({
          tools: normalizeToolsIndex(tools),
          cached: false,
        });
      }

      const { messages } = body;

      const cacheControlledTools = { ...tools };
      const keys = Object.keys(cacheControlledTools);
      const lastKey = keys[keys.length - 1];

      cacheControlledTools[lastKey] = {
        ...cacheControlledTools[lastKey],
        providerOptions: {
          anthropic: { cacheControl: { type: 'ephemeral' } },
        },
      };

      const normalizedMessages = await convertToModelMessages(messages, {
        tools: cacheControlledTools,
      });

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
        stopWhen: stepCountIs(500),
        temperature: 0.2,
        maxRetries: 3,
        ...restChatConfig,
        messages: messagesToInclude,
        system: system + connection.resourceContext,
        tools: cacheControlledTools,
        onFinish: async () => {
          await closeAll?.();
        },
        providerOptions: {
          anthropic: {
            cacheControl: {
              type: 'ephemeral',
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
      await closeAll?.();
      res.status(500);
      return res.send({ error: errorHandler(err) });
    }
  };
  return mcpChatHandler;
};

export const connectChat = (app: FastifyInstance, chatConfiguration: ChatConfiguration) => {
  if (!createMCPClient) {
    logger.warn(
      'Optional dependencies for AI SDK Chat Handler are not installed. Please install @ai-sdk/mcp and ai packages to use this feature.',
    );
    return;
  }

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
