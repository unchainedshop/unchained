import type { FastifyInstance, RouteHandlerMethod, FastifyRequest } from 'fastify';
import type * as aiTypes from 'ai';
import type * as mcpTypes from '@ai-sdk/mcp';
import type { Context } from '../context.ts';
import generateImageHandler from '../chat/generateImageHandler.ts';
import defaultSystemPrompt from '../chat/defaultSystemPrompt.ts';
import normalizeToolsIndex from '../chat/normalizeToolsIndex.ts';
import {
  chatErrorStatus,
  createChatRequestLifecycle,
  type ChatConfiguration,
  errorHandler,
  logOptionalPeerLoadError,
} from '../chat/utils.ts';
import { buildChatResourceContext } from '../mcp/resources/localization.ts';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api:chat');

let convertToModelMessages: typeof aiTypes.convertToModelMessages;
let stepCountIs: typeof aiTypes.stepCountIs;
let streamText: typeof aiTypes.streamText;
let createMCPClient: typeof mcpTypes.createMCPClient;

try {
  const aiTools = await import('ai');
  convertToModelMessages = aiTools.convertToModelMessages;
  stepCountIs = aiTools.stepCountIs;
  streamText = aiTools.streamText;
} catch (error) {
  logOptionalPeerLoadError('ai', error);
}
try {
  const mcpTools = await import('@ai-sdk/mcp');
  createMCPClient = mcpTools.createMCPClient;
} catch (error) {
  logOptionalPeerLoadError('@ai-sdk/mcp', error);
}

const setupMCPChatHandler = (chatConfiguration: ChatConfiguration & any) => {
  if (!chatConfiguration?.model) {
    throw new Error('Model is required');
  }

  const {
    tools: additionalTools = {},
    unchainedMCPUrl = `${process.env.ROOT_URL}/mcp`,
    model,
    imageGenerationTool,
    abortSignal: configuredAbortSignal,
    onAbort: configuredOnAbort,
    onEnd: configuredOnEnd,
    onFinish: configuredOnFinish,
    ...restChatConfig
  } = chatConfiguration;

  const system = chatConfiguration.system ?? defaultSystemPrompt;

  const mcpChatHandler: RouteHandlerMethod = async (req: FastifyRequest, res) => {
    if (req.method === 'OPTIONS') {
      res.headers({
        'access-control-allow-credentials': 'true',
        'access-control-allow-private-network': 'true',
      });
      return res.status(200).send();
    }

    // Chat proxies the admin-gated /mcp surface: enforce the same auth wall up front
    // instead of letting the downstream MCP 401 surface as a 500.
    const unchainedContext = (req as FastifyRequest & { unchainedContext: Context }).unchainedContext;
    const user = unchainedContext?.user;
    if (!user) {
      return res.status(401).send({ error: 'unauthorized' });
    }
    if (!(user.roles || []).includes('admin')) {
      return res.status(403).send({ error: 'forbidden', message: 'Chat requires admin privileges' });
    }

    let client: Awaited<ReturnType<typeof createMCPClient>> | undefined;
    const lifecycle = createChatRequestLifecycle(res.raw, configuredAbortSignal);
    try {
      client = await createMCPClient({
        transport: {
          type: 'http',
          url: unchainedMCPUrl,
          headers: {
            Cookie: req.headers.cookie || '',
          },
        },
        initializationOptions: { signal: lifecycle.signal },
      });
      lifecycle.setClientClose(() => client!.close());

      const defaultUnchainedTools = await client.tools();

      // Shop configuration is read in-process from the same data the MCP resources serve
      // (admin-gated inside the builder, mirroring the /mcp auth wall).
      const resourceContext = await buildChatResourceContext(unchainedContext);

      const tools: aiTypes.ToolSet = {
        ...defaultUnchainedTools,
        ...additionalTools,
      };
      if (imageGenerationTool) {
        tools.generateImage = generateImageHandler(req)(imageGenerationTool) as any;
      }

      if (req.method === 'GET') {
        await lifecycle.close();
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
        maxRetries: 3,
        // No hardcoded temperature: reasoning models (e.g. gpt-5.2) reject it. Callers
        // can set temperature via their chat configuration when using a model that
        // supports it.
        ...restChatConfig,
        abortSignal: lifecycle.signal,
        messages: messagesToInclude,
        system: system + resourceContext,
        model,
        tools: cacheControlledTools,
        onEnd: async (event) => {
          try {
            await (configuredOnEnd ?? configuredOnFinish)?.(event);
          } finally {
            await lifecycle.close();
          }
        },
        onAbort: async (event) => {
          try {
            await configuredOnAbort?.(event);
          } finally {
            await lifecycle.close();
          }
        },
        providerOptions: {
          anthropic: {
            cacheControl: {
              type: 'ephemeral',
            },
          },
        },
      });

      // streamText skips onFinish when the provider errors before the first step (the error
      // only reaches the UI stream's onError callback), so release the MCP client on that
      // termination path too — close() is idempotent.
      void result.finishReason.then(undefined, async () => {
        await lifecycle.close();
      });

      return res.send(
        result.toUIMessageStreamResponse({
          onError: errorHandler,
        }),
      );
    } catch (err: any) {
      logger.error(err);
      await lifecycle.close();
      if (lifecycle.signal.aborted || res.raw.destroyed) return res;
      res.status(chatErrorStatus(err));
      return res.send({ error: errorHandler(err) });
    }
  };
  return mcpChatHandler;
};

export const connectChat = (app: FastifyInstance, chatConfiguration: ChatConfiguration) => {
  if (!createMCPClient || !streamText) {
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
