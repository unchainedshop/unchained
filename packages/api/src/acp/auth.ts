import { timingSafeStringEqual } from '@unchainedshop/utils';
import { ACP_API_VERSION, acpConfig } from './config.ts';
import { ACPError } from './error.ts';

export type ACPHeaders = Record<string, string | string[] | undefined>;

export const getHeader = (headers: ACPHeaders, name: string) => {
  const value = headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

export const verifyACPRequest = async ({ headers, method }: { headers: ACPHeaders; method: string }) => {
  if (!acpConfig.apiKey) {
    throw new ACPError(
      503,
      'api_error',
      'acp_not_configured',
      'UNCHAINED_ACP_API_KEY is not configured',
    );
  }

  const authorization = getHeader(headers, 'authorization');
  const [scheme, token] = authorization?.split(' ') || [];
  if (
    scheme?.toLowerCase() !== 'bearer' ||
    !token ||
    !(await timingSafeStringEqual(token, acpConfig.apiKey))
  ) {
    throw new ACPError(
      401,
      'invalid_api_key_error',
      'invalid_api_key',
      'A valid Bearer token is required',
    );
  }

  const apiVersion = getHeader(headers, 'api-version');
  if (!apiVersion) {
    throw new ACPError(
      400,
      'invalid_request',
      'missing_api_version',
      `API-Version is required. Supported versions: ${ACP_API_VERSION}`,
      '$.headers.API-Version',
    );
  }
  if (apiVersion !== ACP_API_VERSION) {
    throw new ACPError(
      400,
      'invalid_request',
      'unsupported_api_version',
      `Unsupported API-Version. Supported versions: ${ACP_API_VERSION}`,
      '$.headers.API-Version',
    );
  }

  if (method === 'POST' && !getHeader(headers, 'idempotency-key')) {
    throw new ACPError(
      400,
      'invalid_request',
      'idempotency_key_required',
      'Idempotency-Key is required for POST requests',
      '$.headers.Idempotency-Key',
    );
  }
};
