import { createHash } from 'node:crypto';
import type { Context } from '@unchainedshop/api';
import type { PluginHttpRequestContext } from '@unchainedshop/core';
import type { UcpModule } from './module.ts';
import {
  authorizePlatform,
  fetchProfile,
  type UcpPlatform,
  type UcpPluginOptions,
  type UcpProfile,
} from './platform.ts';
import {
  negotiate,
  parseAgentProfile,
  protocolErrorResponse,
  ucpError,
  UCP_VERSION,
} from './protocol.ts';
import { verifyRequest } from './signature.ts';

export type UcpContext = Context & {
  modules: Context['modules'] & UcpModule;
  params: Record<string, string>;
};

export interface UcpRequest {
  request: Request;
  context: UcpContext;
  profileUrl: string;
  platform?: UcpPlatform;
  profile: UcpProfile;
  capabilities: Set<string>;
  body: Record<string, any>;
  options: UcpPluginOptions;
}

export interface UcpResult {
  status: number;
  body: unknown;
}

const MAX_BODY_BYTES = 64 * 1024;

const sha256 = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');

async function readBody(request: Request) {
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of request.body ?? []) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw ucpError('payload_too_large', `Request bodies are limited to ${MAX_BODY_BYTES} bytes`);
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function parseBody(raw: Buffer): Record<string, any> {
  if (!raw.length) return {};
  let body: unknown;
  try {
    body = JSON.parse(raw.toString('utf8'));
  } catch {
    throw ucpError('invalid_request', 'The request body is not JSON');
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw ucpError('invalid_request', 'The request body is not a JSON object');
  }
  return body;
}

function verifySignature(request: Request, raw: Buffer, profile: UcpProfile, platform?: UcpPlatform) {
  if (request.headers.has('signature-input')) {
    const result = verifyRequest(
      { method: request.method, url: new URL(request.url), headers: request.headers, body: raw },
      profile.keys ?? [],
    );
    if (result !== true) throw ucpError(result, `The request signature failed verification (${result})`);
  } else if (platform?.requireSignature) {
    throw ucpError('signature_missing', 'This platform signs its requests');
  }
}

export async function withIdempotency(
  { request, context, profileUrl }: UcpRequest,
  operation: string,
  raw: Buffer,
  run: () => Promise<UcpResult>,
) {
  const respond = async () => {
    const { status, body } = await run();
    return { status, body: JSON.stringify(body) };
  };
  const key = request.headers.get('idempotency-key');
  if (!key || request.method === 'GET') return respond();

  const idempotency = context.modules.ucp.idempotency;
  const _id = sha256(`${profileUrl}|${operation}|${context.params.id ?? ''}|${key}`);
  const bodyHash = sha256(raw);
  let record: Awaited<ReturnType<typeof idempotency.begin>>;
  try {
    record = await idempotency.begin(_id, bodyHash);
  } catch {
    throw ucpError('idempotency_unavailable', 'Idempotency keys cannot be checked right now');
  }
  if (record && record.bodyHash !== bodyHash) {
    throw ucpError('idempotency_conflict', 'The Idempotency-Key was used for a different request body');
  }
  if (record?.response) return record.response;
  if (record) {
    throw ucpError('request_in_progress', 'A request with this Idempotency-Key is in progress');
  }

  let response: Awaited<ReturnType<typeof respond>>;
  try {
    response = await respond();
  } catch (error) {
    await idempotency.release(_id);
    throw error;
  }
  await idempotency.finish(_id, response);
  return response;
}

export const ucpRoute =
  (options: UcpPluginOptions, operation: string, handler: (ucp: UcpRequest) => Promise<UcpResult>) =>
  async (request: Request, context: PluginHttpRequestContext) => {
    try {
      const profileUrl = parseAgentProfile(request.headers.get('ucp-agent'));
      const platform = authorizePlatform(profileUrl, context.user, options);
      const profile = await fetchProfile(profileUrl);
      if (profile.ucp.version !== UCP_VERSION) {
        throw ucpError(
          'version_unsupported',
          `Protocol version ${profile.ucp.version} is not supported, this business implements ${UCP_VERSION}`,
        );
      }
      const raw = await readBody(request);
      verifySignature(request, raw, profile, platform);
      const ucp: UcpRequest = {
        request,
        context: context as UcpContext,
        profileUrl,
        platform,
        profile,
        capabilities: negotiate(profile.ucp.capabilities),
        body: parseBody(raw),
        options,
      };
      const { status, body } = await withIdempotency(ucp, operation, raw, () => handler(ucp));
      return new Response(body, { status, headers: { 'content-type': 'application/json' } });
    } catch (error) {
      const response = protocolErrorResponse(error);
      if (response) return response;
      throw error;
    }
  };
