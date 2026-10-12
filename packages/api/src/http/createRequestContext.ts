import { runWithAuditContext } from '@unchainedshop/events';
import type { AuthConfig } from '../auth.ts';
import { getCurrentContextResolver, type Context } from '../context.ts';
import { createAuthContext } from '../middleware/createAuthMiddleware.ts';

export interface RequestContextParams {
  getHeader: (name: string) => string | undefined;
  setHeader: (name: string, value: string) => void;
  /** Adds a response header field, also when one of the same name exists (Set-Cookie) */
  appendHeader: (name: string, value: string) => void;
  /** Address and port of the client socket */
  remoteAddress?: string;
  remotePort?: number;
}

/**
 * SECURITY: Proxy headers (x-forwarded-for, x-real-ip) can be spoofed unless the application
 * runs behind a reverse proxy that strips or validates them, so they only count with
 * trustProxy. The last X-Forwarded-For entry is the one our trusted proxy appended, earlier
 * ones come from the client.
 */
export const resolveRemoteAddress = (
  getHeader: (name: string) => string | undefined,
  socketAddress?: string,
  trustProxy = false,
): string | undefined => {
  if (!trustProxy) return socketAddress;
  return (
    getHeader('x-real-ip') || getHeader('x-forwarded-for')?.split(',').at(-1)?.trim() || socketAddress
  );
};

/** The request context of GraphQL, MCP, chat, plugin routes and the app's own routes */
export async function createRequestContext(
  params: RequestContextParams,
  { authConfig, trustProxy = false }: { authConfig?: AuthConfig; trustProxy?: boolean } = {},
  /** The server's own request and response, passed on to custom context resolvers */
  req?: unknown,
  res?: unknown,
): Promise<Context> {
  const { getHeader, setHeader, appendHeader, remotePort } = params;
  const remoteAddress = resolveRemoteAddress(getHeader, params.remoteAddress, trustProxy);
  const authContext = await createAuthContext({ getHeader, appendHeader, remoteAddress }, authConfig);
  const resolveContext = getCurrentContextResolver();
  return resolveContext(
    {
      setHeader,
      getHeader,
      remoteAddress,
      remotePort,
      login: authContext.login,
      logout: authContext.logout,
      accessToken: authContext.accessToken,
      userId: authContext.userId,
      impersonatorId: authContext.impersonatorId,
      tokenVersion: authContext.tokenVersion,
    },
    req,
    res,
  );
}

/** Runs fn as the user of the request context: the events emitted meanwhile carry its identity */
export const withAuditContext = <T>(context: Context, fn: () => T): T =>
  runWithAuditContext(
    {
      // Never the access token: for API-key authentication it is the raw secret
      userId: context.userId,
      userName: context.user?.username || context.user?.emails?.[0]?.address,
      remoteAddress: context.remoteAddress,
    },
    fn,
  );
