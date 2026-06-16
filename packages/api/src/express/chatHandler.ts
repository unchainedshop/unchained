import express from 'express';
import type { Express, Request, RequestHandler, Response } from 'express';
import type * as aiTypes from 'ai';
import type * as mcpTypes from '@ai-sdk/mcp';
import { type ChatConfiguration, errorHandler } from '../chat/utils.ts';
import generateImageHandler from '../chat/generateImageHandler.ts';
import defaultSystemPrompt from '../chat/defaultSystemPrompt.ts';
import normalizeToolsIndex from '../chat/normalizeToolsIndex.ts';
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
  logger.warn(
    `optional peer npm packages 'ai', '@ai-sdk/mcp' and '@modelcontextprotocol/sdk' not installed, chat will not work`,
  );
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

    let closeAll: (() => Promise<void>) | undefined;

    try {
      const extraMCPServers: MCPServerConfig[] = req.body?.mcpServers || [];

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
        stopWhen: stepCountIs(10),
        temperature: 0.2,
        maxRetries: 3,
        ...restChatConfig,
        system: system + connection.resourceContext,
        model,
        tools: cacheControlledTools,
        onFinish: async () => {
          await closeAll?.();
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
      await closeAll?.();
      res.status(500).json({ error: errorHandler(err) });
    }
  };

  return mcpChatHandler;
};

export const connectChat = (app: Express, chatConfiguration: ChatConfiguration) => {
  if (!createMCPClient) {
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
