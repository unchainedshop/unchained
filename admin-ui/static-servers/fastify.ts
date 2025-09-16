import path from 'path';
import {
  FastifyInstance,
  FastifyPluginAsync,
  RouteHandlerMethod,
  FastifyRequest,
} from 'fastify';
import fastifyStatic from '@fastify/static';
import { ChatConfiguration, errorHandler } from './utils';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {
  convertToModelMessages,
  experimental_createMCPClient as createMCPClient,
  MCPTransport,
  stepCountIs,
  streamText,
  ToolSet,
} from 'ai';
import generateImageHandler from './generateImageHandler';
import defaultSystemPrompt from './defaultSystemPrompt';
import normalizeToolsIndex from './normalizeToolsIndex';

const staticPath = path.join(__dirname, '..', 'out');

interface FastifyRouterOptions {
  prefix?: string;
}

export const fastifyRouter: FastifyPluginAsync<FastifyRouterOptions> = async (
  fastify: FastifyInstance,
  opts,
) => {
  fastify.register(fastifyStatic, {
    root: staticPath,
    prefix: opts.prefix || '/',
  });

  fastify.setNotFoundHandler((request, reply) => {
    if (request.raw.method === 'GET') {
      reply.type('text/html').sendFile('index.html');
    } else {
      reply.status(404).send({ error: 'Not Found' });
    }
  });
};

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

  const mcpChatHandler: RouteHandlerMethod = async (
    req: FastifyRequest,
    res,
  ) => {
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
      if (req.method === 'OPTIONS') return res.send();

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
        return res.status(200).send({
          tools: normalizeToolsIndex(tools),
          cached: false,
        });
      }

      const { messages } = req.body as any;
      const result = streamText({
        stopWhen: stepCountIs(10),
        ...restChatConfig,
        messages: convertToModelMessages(messages, {
          tools,
          ignoreIncompleteToolCalls: true,
        }),
        system,
        tools,
        onFinish: async () => {
          await client?.close();
        },
      });

      return res.send(
        result.toUIMessageStreamResponse({
          onError: errorHandler,
        }),
      );
    } catch (err: any) {
      await client?.close();
      res.status(500);
      return res.send(JSON.stringify({ error: errorHandler(err) }));
    }
  };
  return mcpChatHandler;
};

export const connectChat = (
  app: FastifyInstance,
  chatConfiguration: ChatConfiguration,
) => {
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
