import type * as mcpSDKClientLibraryTypes from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type * as mcpSDKClientTypes from '@modelcontextprotocol/sdk/client/index.js';
import type * as aiTypes from 'ai';
import type * as mcpTypes from '@ai-sdk/mcp';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api:chat');

let createMCPClient: typeof mcpTypes.createMCPClient;
let StreamableHTTPClientTransport: typeof mcpSDKClientLibraryTypes.StreamableHTTPClientTransport;
let Client: typeof mcpSDKClientTypes.Client;

try {
  const mcpTools = await import('@ai-sdk/mcp');
  const mcpSDKClientLibrary = await import('@modelcontextprotocol/sdk/client/streamableHttp.js');
  const mcpSDKClient = await import('@modelcontextprotocol/sdk/client/index.js');

  StreamableHTTPClientTransport = mcpSDKClientLibrary.StreamableHTTPClientTransport;
  Client = mcpSDKClient.Client;
  createMCPClient = mcpTools.createMCPClient;
} catch {
  // Handled at handler level
}

const { UNCHAINED_COOKIE_NAME = 'unchained_token' } = process.env;

interface CachedSession {
  tools: aiTypes.ToolSet;
  resourceContext: string;
  timestamp: number;
  toolClient: Awaited<ReturnType<typeof mcpTypes.createMCPClient>>;
}

const sessionCache = new Map<string, CachedSession>();
const inflightRequests = new Map<string, Promise<{ tools: aiTypes.ToolSet; resourceContext: string }>>();

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_SESSIONS = 50;

function extractAuthToken(cookie: string): string | null {
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${UNCHAINED_COOKIE_NAME}=([^;]+)`));
  return match?.[1] || null;
}

function evictStale() {
  const now = Date.now();
  for (const [key, session] of sessionCache) {
    if (now - session.timestamp > CACHE_TTL_MS) {
      session.toolClient.close().catch(() => undefined);
      sessionCache.delete(key);
    }
  }
}

function evictOldest() {
  if (sessionCache.size < MAX_SESSIONS) return;
  let oldestKey: string | null = null;
  let oldestTime = Infinity;
  for (const [key, session] of sessionCache) {
    if (session.timestamp < oldestTime) {
      oldestTime = session.timestamp;
      oldestKey = key;
    }
  }
  if (oldestKey) {
    sessionCache
      .get(oldestKey)!
      .toolClient.close()
      .catch(() => undefined);
    sessionCache.delete(oldestKey);
  }
}

async function fetchResources(mcpUrl: string, cookie: string): Promise<string> {
  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl), {
    requestInit: { headers: { Cookie: cookie } },
  });
  const sdkClient = new Client({ name: 'unchained-chat-client', version: '1.0.0' });

  try {
    await sdkClient.connect(transport as any);
    const resources = await sdkClient.listResources();
    if (!resources?.resources?.length) return '';

    const resourceTexts = await Promise.all(
      resources.resources.map(async (resource) => {
        try {
          const content = await sdkClient.readResource({ uri: resource.uri });
          if ((content?.contents?.[0] as any)?.text) {
            return `${resource.name}:\n${(content.contents[0] as any).text}`;
          }
        } catch (e: any) {
          logger.error(`Failed to read resource ${resource.uri}: ${e.message}`);
        }
        return null;
      }),
    );

    const joined = resourceTexts.filter(Boolean).join('\n\n');
    return joined ? '\n\nAVAILABLE SHOP CONFIGURATION:\n' + joined : '';
  } finally {
    await sdkClient.close().catch(() => undefined);
  }
}

async function createSession(
  mcpUrl: string,
  cookie: string,
  cacheKey: string,
): Promise<{ tools: aiTypes.ToolSet; resourceContext: string }> {
  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl), {
    requestInit: { headers: { Cookie: cookie } },
  });

  const toolClient = await createMCPClient({ transport });
  const tools = await toolClient.tools();
  const resourceContext = await fetchResources(mcpUrl, cookie);

  evictOldest();
  sessionCache.set(cacheKey, {
    tools,
    resourceContext,
    timestamp: Date.now(),
    toolClient,
  });

  return { tools, resourceContext };
}

export async function getMCPSession(
  mcpUrl: string,
  cookie: string,
): Promise<{ tools: aiTypes.ToolSet; resourceContext: string }> {
  evictStale();

  const authToken = extractAuthToken(cookie);
  if (!authToken) {
    throw new Error('No authentication token found');
  }

  const cacheKey = authToken;
  const cached = sessionCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { tools: cached.tools, resourceContext: cached.resourceContext };
  }

  if (cached) {
    cached.toolClient.close().catch(() => undefined);
    sessionCache.delete(cacheKey);
  }

  // Deduplicate concurrent requests for the same session
  const inflight = inflightRequests.get(cacheKey);
  if (inflight) return inflight;

  const promise = createSession(mcpUrl, cookie, cacheKey).finally(() => {
    inflightRequests.delete(cacheKey);
  });
  inflightRequests.set(cacheKey, promise);

  return promise;
}

export { createMCPClient };
