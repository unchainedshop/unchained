import type * as aiTypes from 'ai';
import type * as mcpTypes from '@ai-sdk/mcp';
import type * as mcpSDKClientTypes from '@modelcontextprotocol/sdk/client/index.js';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api:chat');

let createMCPClient: typeof mcpTypes.createMCPClient;
let Client: typeof mcpSDKClientTypes.Client;

try {
  const mcpTools = await import('@ai-sdk/mcp');
  const mcpSDKClient = await import('@modelcontextprotocol/sdk/client/index.js');
  createMCPClient = mcpTools.createMCPClient;
  Client = mcpSDKClient.Client;
} catch {
  // handled at handler level
}

export interface MCPServerConfig {
  url: string;
  name?: string;
  headers?: Record<string, string>;
}

export interface MCPConnectionResult {
  tools: aiTypes.ToolSet;
  resourceContext: string;
  closeAll: () => Promise<void>;
}

async function connectSingleMCPServer(
  serverConfig: MCPServerConfig,
  requestHeaders: Record<string, string>,
): Promise<{
  tools: aiTypes.ToolSet;
  resourceContext: string;
  close: () => Promise<void>;
}> {
  const headers = {
    ...requestHeaders,
    ...serverConfig.headers,
  };

  const client = await createMCPClient({
    transport: {
      type: 'http',
      url: serverConfig.url,
      headers,
    },
    name: serverConfig.name || 'unchained-chat-client',
  });

  const tools = await client.tools();

  let resourceContext = '';
  try {
    const sdkClient = new Client({
      name: serverConfig.name || 'unchained-resource-client',
      version: '1.0.0',
    });

    const { StreamableHTTPClientTransport } = await import(
      '@modelcontextprotocol/sdk/client/streamableHttp.js'
    );
    const resourceTransport = new StreamableHTTPClientTransport(new URL(serverConfig.url), {
      requestInit: { headers },
    });
    await sdkClient.connect(resourceTransport as any);

    const resources = await sdkClient.listResources();
    if (resources?.resources) {
      const resourceTexts = await Promise.all(
        resources.resources.map(async (resource) => {
          try {
            const content = await sdkClient.readResource({ uri: resource.uri });
            if ((content?.contents?.[0] as any)?.text) {
              return `${resource.name}:\n${(content.contents[0] as any).text}`;
            }
          } catch (e) {
            logger.error(`Failed to read resource ${resource.uri}: ${e.message}`);
          }
          return null;
        }),
      );
      const filtered = resourceTexts.filter(Boolean);
      if (filtered.length > 0) {
        resourceContext = filtered.join('\n\n');
      }
    }
    await sdkClient.close().catch(() => {});
  } catch (e) {
    logger.debug(`No resources from ${serverConfig.url}: ${e.message}`);
  }

  return {
    tools: tools as aiTypes.ToolSet,
    resourceContext,
    close: () => client.close(),
  };
}

export async function connectMCPServers(
  serverConfigs: MCPServerConfig[],
  requestHeaders: Record<string, string>,
): Promise<MCPConnectionResult> {
  const allTools: aiTypes.ToolSet = {};
  const resourceParts: string[] = [];
  const closeFns: Array<() => Promise<void>> = [];

  const results = await Promise.allSettled(
    serverConfigs.map((config) => connectSingleMCPServer(config, requestHeaders)),
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const config = serverConfigs[i];

    if (result.status === 'fulfilled') {
      const prefix =
        serverConfigs.length > 1 && config.name
          ? `${config.name.replace(/[^a-zA-Z0-9_]/g, '_')}__`
          : '';

      for (const [name, tool] of Object.entries(result.value.tools)) {
        allTools[`${prefix}${name}`] = tool;
      }

      if (result.value.resourceContext) {
        const label = config.name || config.url;
        resourceParts.push(`[${label}]\n${result.value.resourceContext}`);
      }

      closeFns.push(result.value.close);
    } else {
      logger.error(
        `Failed to connect to MCP server "${config.name || config.url}": ${result.reason}`,
      );
    }
  }

  const resourceContext =
    resourceParts.length > 0
      ? '\n\nAVAILABLE RESOURCES:\n' + resourceParts.join('\n\n')
      : '';

  return {
    tools: allTools,
    resourceContext,
    closeAll: async () => {
      await Promise.allSettled(closeFns.map((fn) => fn()));
    },
  };
}
