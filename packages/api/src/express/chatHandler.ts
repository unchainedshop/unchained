import express from 'express';
import type { Express, Request, RequestHandler, Response } from 'express';
import type * as aiTypes from 'ai';
import type * as mcpTypes from '@ai-sdk/mcp';
import type { Context } from '../context.ts';
import {
  chatErrorStatus,
  createChatRequestLifecycle,
  type ChatConfiguration,
  errorHandler,
  logOptionalPeerLoadError,
} from '../chat/utils.ts';
import generateImageHandler from '../chat/generateImageHandler.ts';
import defaultSystemPrompt from '../chat/defaultSystemPrompt.ts';
import normalizeToolsIndex from '../chat/normalizeToolsIndex.ts';
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

const setupMCPChatHandler = (chatConfiguration: ChatConfiguration & any): RequestHandler => {
  if (!chatConfiguration || !chatConfiguration.model) {
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

    // Chat proxies the admin-gated /mcp surface: enforce the same auth wall up front
    // instead of letting the downstream MCP 401 surface as a 500.
    const unchainedContext = (req as Request & { unchainedContext?: Context }).unchainedContext;
    const user = unchainedContext?.user;
    if (!user) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    if (!(user.roles || []).includes('admin')) {
      res.status(403).json({ error: 'forbidden', message: 'Chat requires admin privileges' });
      return;
    }

    let client: Awaited<ReturnType<typeof createMCPClient>> | undefined;
    const lifecycle = createChatRequestLifecycle(res, configuredAbortSignal);
    try {
      client = await createMCPClient({
        transport: {
          type: 'http',
          url: unchainedMCPUrl,
          headers: {
            // Forward both auth mechanisms accepted by /mcp: cookie sessions and bearer tokens
            Cookie: req.headers.cookie || '',
            ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
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
        messages: messagesToInclude,
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

      result.pipeUIMessageStreamToResponse(res, {
        onError: errorHandler,
      });
    } catch (err) {
      logger.error(err);
      await lifecycle.close();
      if (lifecycle.signal.aborted || res.destroyed || res.writableEnded) return;
      res.status(chatErrorStatus(err)).json({ error: errorHandler(err) });
    }
  };

  return mcpChatHandler;
};

export const connectChat = (app: Express, chatConfiguration: ChatConfiguration) => {
  if (!createMCPClient || !streamText) {
    logger.warn(
      'Optional dependencies for AI SDK Chat Handler are not installed. Please install @ai-sdk/mcp and ai packages to use this feature.',
    );
    return;
  }

  const handler = setupMCPChatHandler(chatConfiguration);
  if (!handler) {
    throw new Error('Invalid chat configuration: model is required.');
  }
  app.post('/chat', express.json({ limit: '10mb' }), handler);
  app.options('/chat', handler);
  app.get('/chat/tools', handler);
};
