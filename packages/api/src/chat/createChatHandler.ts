import type * as aiTypes from 'ai';
import type * as mcpTypes from '@ai-sdk/mcp';
import type { Context } from '../context.ts';
import generateImageHandler from './generateImageHandler.ts';
import defaultSystemPrompt from './defaultSystemPrompt.ts';
import normalizeToolsIndex from './normalizeToolsIndex.ts';
import {
  chatErrorStatus,
  createChatRequestLifecycle,
  type ChatConfiguration,
  errorHandler,
  logOptionalPeerLoadError,
} from './utils.ts';
import { buildChatResourceContext } from '../mcp/resources/localization.ts';
import { isAllowedBrowserOrigin } from '../mcp/handleMcpHttpRequest.ts';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api:chat');

const MAX_BODY_SIZE = 10 * 1024 * 1024;

const readBodyWithinLimit = async (request: Request) => {
  if (Number(request.headers.get('content-length')) > MAX_BODY_SIZE) return undefined;
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of request.body ?? []) {
    size += chunk.byteLength;
    if (size > MAX_BODY_SIZE) return undefined;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString();
};

const parseMessages = (text: string) => {
  try {
    return (JSON.parse(text) as { messages?: unknown }).messages;
  } catch {
    return undefined;
  }
};

const readMessages = async (request: Request) => {
  const contentType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    return Response.json({ error: 'messages must be application/json' }, { status: 415 });
  }
  const body = await readBodyWithinLimit(request).catch(() => '');
  if (body === undefined) return Response.json({ error: 'messages too large' }, { status: 413 });
  const messages = parseMessages(body);
  return Array.isArray(messages)
    ? messages
    : Response.json({ error: 'messages missing' }, { status: 400 });
};

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

export const createChatHandler = (chatConfiguration: ChatConfiguration) => {
  if (!createMCPClient || !streamText) {
    logger.warn(
      'Optional dependencies for AI SDK Chat Handler are not installed. Please install @ai-sdk/mcp and ai packages to use this feature.',
    );
    return undefined;
  }
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
    allowedOrigins = [],
    ...restChatConfig
  }: any = chatConfiguration;

  const system = chatConfiguration.system ?? defaultSystemPrompt;
  const pageOrigins: string[] = allowedOrigins.map((origin: string) => new URL(origin).origin);

  return async (request: Request, context: Context): Promise<Response> => {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'access-control-allow-credentials': 'true',
          'access-control-allow-private-network': 'true',
        },
      });
    }

    // Chat proxies the admin-gated /mcp surface: enforce the same auth wall up front
    // instead of letting the downstream MCP 401 surface as a 500.
    const { user } = context;
    if (!user) {
      return Response.json({ error: 'unauthorized' }, { status: 401 });
    }
    if (!(user.roles || []).includes('admin')) {
      return Response.json(
        { error: 'forbidden', message: 'Chat requires admin privileges' },
        { status: 403 },
      );
    }

    if (!isAllowedBrowserOrigin(request, pageOrigins)) {
      return Response.json({ error: 'forbidden', message: 'Origin not allowed' }, { status: 403 });
    }
    const messages = request.method === 'POST' ? await readMessages(request) : [];
    if (messages instanceof Response) return messages;

    const lifecycle = createChatRequestLifecycle(request.signal, configuredAbortSignal);
    try {
      const client = await createMCPClient({
        transport: {
          type: 'http',
          url: unchainedMCPUrl,
          headers: {
            // Forward both auth mechanisms accepted by /mcp: cookie sessions and bearer tokens
            Cookie: request.headers.get('cookie') || '',
            ...(request.headers.has('authorization')
              ? { Authorization: request.headers.get('authorization')! }
              : {}),
          },
        },
        initializationOptions: { signal: lifecycle.signal },
      });
      lifecycle.setClientClose(() => client.close());

      const defaultUnchainedTools = await client.tools();

      // Shop configuration is read in-process from the same data the MCP resources serve
      // (admin-gated inside the builder, mirroring the /mcp auth wall).
      const resourceContext = await buildChatResourceContext(context);

      const tools: aiTypes.ToolSet = {
        ...defaultUnchainedTools,
        ...additionalTools,
      };
      if (imageGenerationTool) {
        tools.generateImage = generateImageHandler(request)(imageGenerationTool) as any;
      }

      if (request.method !== 'POST') {
        await lifecycle.close();
        return Response.json({
          tools: normalizeToolsIndex(tools),
          cached: false,
        });
      }

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

      return result.toUIMessageStreamResponse({
        onError: errorHandler,
      });
    } catch (err) {
      logger.error(err);
      await lifecycle.close();
      return Response.json({ error: errorHandler(err) }, { status: chatErrorStatus(err) });
    }
  };
};
