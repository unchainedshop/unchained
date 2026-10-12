import { runWithAuditContext } from '@unchainedshop/events';
import type { AuthConfig } from '../auth.ts';
import { getCurrentContextResolver, type Context } from '../context.ts';
import { createAuthContext } from '../middleware/createAuthMiddleware.ts';

export interface RequestContextParams {
  getHeader: (name: string) => string | undefined;
  setHeader: (name: string, value: string) => void;
  appendHeader: (name: string, value: string) => void;
  remoteAddress?: string;
  remotePort?: number;
}

export async function createRequestContext(
  { getHeader, setHeader, appendHeader, remoteAddress: socketAddress, remotePort }: RequestContextParams,
  { authConfig, trustProxy = false }: { authConfig?: AuthConfig; trustProxy?: boolean } = {},
  req?: unknown,
  res?: unknown,
): Promise<Context> {
  const proxiedAddress =
    getHeader('x-real-ip') || getHeader('x-forwarded-for')?.split(',').at(-1)?.trim();
  const remoteAddress = (trustProxy && proxiedAddress) || socketAddress;
  const authContext = await createAuthContext({ getHeader, appendHeader, remoteAddress }, authConfig);
  return getCurrentContextResolver()(
    { getHeader, setHeader, remoteAddress, remotePort, ...authContext },
    req,
    res,
  );
}

export const withAuditContext = <T>(context: Context, fn: () => T): T =>
  runWithAuditContext(
    {
      userId: context.userId,
      userName: context.user?.username || context.user?.emails?.[0]?.address,
      remoteAddress: context.remoteAddress,
    },
    fn,
  );
