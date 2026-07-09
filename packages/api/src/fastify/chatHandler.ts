import type { FastifyInstance, RouteHandlerMethod, FastifyRequest } from 'fastify';
import type * as aiTypes from 'ai';
import generateImageHandler from '../chat/generateImageHandler.ts';
import defaultSystemPrompt from '../chat/defaultSystemPrompt.ts';
import normalizeToolsIndex from '../chat/normalizeToolsIndex.ts';
import { type ChatConfiguration, errorHandler } from '../chat/utils.ts';
import { getMCPSession, createMCPClient } from '../chat/mcpChatSession.ts';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api:chat');

let convertToModelMessages: typeof aiTypes.convertToModelMessages;
let stepCountIs: typeof aiTypes.stepCountIs;
let streamText: typeof aiTypes.streamText;

try {
  const aiTools = await import('ai');
  convertToModelMessages = aiTools.convertToModelMessages;
  stepCountIs = aiTools.stepCountIs;
  streamText = aiTools.streamText;
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
    try {
      if (req.method === 'OPTIONS') {
        res.headers({
          'access-control-allow-credentials': 'true',
          'access-control-allow-private-network': 'true',
        });
        return res.status(200).send();
      }

      const cookie = req.headers.cookie || '';
      const { tools: mcpTools, resourceContext } = await getMCPSession(unchainedMCPUrl, cookie);

      const tools: aiTypes.ToolSet = {
        ...mcpTools,
        ...additionalTools,
      };
      if (imageGenerationTool) {
        tools.generateImage = generateImageHandler(req)(imageGenerationTool) as any;
      }

      if (req.method === 'GET') {
        return res.status(200).send({
          tools: normalizeToolsIndex(tools),
          cached: true,
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

      const normalizedMessages = await convertToModelMessages(messages, { tools: cacheControlledTools });

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
        system: system + resourceContext,
        tools: cacheControlledTools,
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
