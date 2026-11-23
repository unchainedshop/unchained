import type { McpHttpHandler, McpServer } from '@modelcontextprotocol/server';
import { createLogger } from '@unchainedshop/logger';
import type { Context } from '../context.ts';

const logger = createLogger('unchained:api:mcp');

let sdk: typeof import('@modelcontextprotocol/server') | undefined;
try {
  sdk = await import('@modelcontextprotocol/server');
} catch (error) {
  if ((error as Error)?.message?.startsWith("Cannot find package '@modelcontextprotocol/server'")) {
    logger.warn(
      `optional peer npm package '@modelcontextprotocol/server' not installed, mcp will not work`,
    );
  } else {
    logger.error(`failed to load '@modelcontextprotocol/server'`, error);
  }
}

export const mcpSdk = () => sdk;

export const mcpResourceUrl = () => process.env.ROOT_URL || 'http://localhost:4010';

export const configuredHostname = () => URL.parse(mcpResourceUrl())?.hostname ?? 'localhost';

export function createMcpHttpHandler(
  info: { name: string; version: string },
  register: (server: McpServer, context: Context) => unknown,
  {
    allowedHostnames = [],
    ...handlerOptions
  }: { allowedHostnames?: string[]; maxRequestBodySize?: number; maxSubscriptions?: number } = {},
) {
  let handler: McpHttpHandler | undefined;

  return async (request: Request, context: Context): Promise<Response> => {
    if (!sdk) {
      return Response.json(
        {
          error: 'unavailable',
          message: `MCP is enabled but the optional peer npm package '@modelcontextprotocol/server' is not installed`,
        },
        { status: 503 },
      );
    }

    const hostnames = [configuredHostname(), ...allowedHostnames];
    const validationFailure =
      sdk.hostHeaderValidationResponse(request, [...sdk.localhostAllowedHostnames(), ...hostnames]) ??
      sdk.originValidationResponse(request, [...sdk.localhostAllowedOrigins(), ...hostnames]);
    if (validationFailure) return validationFailure;

    const { createMcpHandler, McpServer: Server } = sdk;
    handler ??= createMcpHandler(async ({ authInfo }) => {
      const server = new Server(info);
      await register(server, (authInfo!.extra as { context: Context }).context);
      return server;
    }, handlerOptions);

    return handler.fetch(request, {
      authInfo: {
        token: 'unchained-context',
        clientId: context.user?._id ?? 'anonymous',
        scopes: context.user?.roles ?? [],
        extra: { context },
      },
    });
  };
}
