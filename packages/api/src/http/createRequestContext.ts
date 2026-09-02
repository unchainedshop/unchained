import type { IncomingHttpHeaders, IncomingMessage } from 'node:http';
import type { AuditRequestContext } from '@unchainedshop/events';
import type { AuthConfig } from '../auth.ts';
import { getCurrentContextResolver, type Context } from '../context.ts';
import { createAuthContext, type AuthContextParams } from '../middleware/createAuthMiddleware.ts';

export const headerValue = (headers: IncomingHttpHeaders, name: string): string | undefined => {
  const value = headers[name.toLowerCase()];
  return Array.isArray(value) ? value.join(', ') : value;
};

export const resolveRemoteAddress = (
  request: Pick<IncomingMessage, 'headers' | 'socket'>,
  trustProxy = false,
) => {
  if (!trustProxy) {
    return {
      remoteAddress: request.socket?.remoteAddress,
      remotePort: request.socket?.remotePort,
    };
  }

  const forwardedFor = headerValue(request.headers, 'x-forwarded-for');
  const forwardedAddresses = forwardedFor?.split(',').map((address) => address.trim());
  return {
    remoteAddress:
      headerValue(request.headers, 'x-real-ip') ||
      forwardedAddresses?.[forwardedAddresses.length - 1] ||
      request.socket?.remoteAddress,
    remotePort: request.socket?.remotePort,
  };
};

export async function createRequestContext(
  authContextParams: AuthContextParams,
  authConfig: AuthConfig | undefined,
  request: unknown,
  response: unknown,
): Promise<{ context: Context; auditContext: AuditRequestContext }> {
  const authContext = await createAuthContext(authContextParams, authConfig);
  const resolveContext = getCurrentContextResolver();
  const context = await resolveContext(
    {
      setHeader: authContextParams.setHeader,
      getHeader: authContextParams.getHeader,
      remoteAddress: authContextParams.remoteAddress,
      remotePort: authContextParams.remotePort,
      login: authContext.login,
      logout: authContext.logout,
      accessToken: authContext.accessToken,
      userId: authContext.userId,
      impersonatorId: authContext.impersonatorId,
      tokenVersion: authContext.tokenVersion,
    },
    request,
    response,
  );

  return {
    context,
    // Never put authContext.accessToken here: for API-key authentication it is
    // the raw secret and must not reach audit sinks.
    auditContext: {
      userId: context.userId,
      userName: context.user?.username || context.user?.emails?.[0]?.address,
      remoteAddress: authContextParams.remoteAddress,
    },
  };
}
