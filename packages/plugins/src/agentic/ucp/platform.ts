import { lookup as dnsLookup, type LookupAddress } from 'node:dns';
import { request as httpRequest, type IncomingHttpHeaders } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { BlockList, isIP } from 'node:net';
import type { Order } from '@unchainedshop/core-orders';
import type { User } from '@unchainedshop/core-users';
import { ucpError } from './protocol.ts';
import type { UcpPaymentHandler } from './payment.ts';
import type { Jwk } from './signature.ts';

export interface UcpPlatform {
  profile: string;
  username?: string;
  requireSignature?: boolean;
  renderOrigins?: string[];
  actions?: boolean;
}

export interface UcpPluginOptions {
  platforms?: UcpPlatform[];
  anonymous?: boolean;
  paymentHandlers?: UcpPaymentHandler[];
  checkoutUrl?: (orderId: string) => string;
  orderUrl?: (order: Order) => string;
  links?: { type: string; url: string; title?: string }[];
  basePath?: string;
}

export interface UcpProfile {
  ucp: {
    version: string;
    services: Record<string, any[]>;
    capabilities?: Record<string, { version?: string; config?: Record<string, any> }[]>;
    payment_handlers: Record<string, any[]>;
  };
  keys?: Jwk[];
}

const SPECIAL_USE = `0.0.0.0/8 10.0.0.0/8 100.64.0.0/10 127.0.0.0/8 169.254.0.0/16 172.16.0.0/12 192.0.0.0/24
  192.0.2.0/24 192.88.99.0/24 192.168.0.0/16 198.18.0.0/15 198.51.100.0/24 203.0.113.0/24 224.0.0.0/3
  ::/128 ::1/128 64:ff9b::/96 64:ff9b:1::/48 100::/64 2001::/23 2001:db8::/32 2002::/16 fc00::/7 fe80::/10
  ff00::/8`;

const specialUse = new BlockList();
for (const [network, prefix] of SPECIAL_USE.split(/\s+/).map((cidr) => cidr.split('/'))) {
  specialUse.addSubnet(network, Number(prefix), isIP(network) === 6 ? 'ipv6' : 'ipv4');
}

export const isSpecialUseAddress = (address: string) =>
  specialUse.check(address, isIP(address) === 6 ? 'ipv6' : 'ipv4');

const insecureHosts = () =>
  process.env.NODE_ENV === 'production'
    ? []
    : (process.env.UCP_DEV_INSECURE_HOSTS ?? '')
        .split(',')
        .map((host) => host.trim())
        .filter(Boolean);

export function guardedRequest(
  url: string,
  {
    method = 'GET',
    headers = {},
    body,
    maxBytes = 256 * 1024,
    lookup = dnsLookup,
  }: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    maxBytes?: number;
    lookup?: typeof dnsLookup;
  } = {},
) {
  const target = new URL(url);
  const trusted = insecureHosts().includes(target.hostname);
  if (target.username || (target.protocol !== 'https:' && !(trusted && target.protocol === 'http:'))) {
    throw ucpError('invalid_profile_url', `${url} is not an HTTPS URL`);
  }
  const hostname = target.hostname.replace(/^\[|\]$/g, '');
  if (!trusted && isIP(hostname) && isSpecialUseAddress(hostname)) {
    throw ucpError('profile_unreachable', `${hostname} is a special-use address`);
  }
  const guardedLookup = (host: string, options: any, callback: any) =>
    lookup(host, { ...options, all: true }, (error, addresses: LookupAddress[]) => {
      if (error) return callback(error);
      if (!trusted && addresses.some(({ address }) => isSpecialUseAddress(address))) {
        return callback(new Error(`${host} resolves to a special-use address`));
      }
      if (options.all) return callback(null, addresses);
      return callback(null, addresses[0].address, addresses[0].family);
    });

  return new Promise<{ status: number; headers: IncomingHttpHeaders; body: Buffer }>(
    (resolve, reject) => {
      const send = target.protocol === 'https:' ? httpsRequest : httpRequest;
      const outgoing = send(
        target,
        {
          method,
          headers:
            body === undefined
              ? headers
              : { ...headers, 'content-length': String(Buffer.byteLength(body)) },
          lookup: guardedLookup,
          signal: AbortSignal.timeout(5000),
        },
        (response) => {
          const chunks: Buffer[] = [];
          let size = 0;
          response.on('data', (chunk: Buffer) => {
            size += chunk.length;
            if (size > maxBytes) outgoing.destroy(new Error(`Response exceeds ${maxBytes} bytes`));
            else chunks.push(chunk);
          });
          response.on('end', () =>
            resolve({
              status: response.statusCode!,
              headers: response.headers,
              body: Buffer.concat(chunks),
            }),
          );
        },
      );
      outgoing.on('error', reject);
      outgoing.end(body);
    },
  );
}

const isRecord = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isList = (value: unknown) => Array.isArray(value) && value.every(isRecord);

const isProfile = (profile: any): profile is UcpProfile =>
  isRecord(profile?.ucp) &&
  typeof profile.ucp.version === 'string' &&
  [profile.ucp.services, profile.ucp.payment_handlers, profile.ucp.capabilities ?? {}].every(
    (registry) => isRecord(registry) && Object.values(registry).every(isList),
  ) &&
  (profile.keys === undefined || isList(profile.keys));

const profiles = new Map<string, { profile: UcpProfile; expires: number }>();

export async function fetchProfile(url: string) {
  const cached = profiles.get(url);
  if (cached && cached.expires > Date.now()) return cached.profile;

  let response: Awaited<ReturnType<typeof guardedRequest>>;
  try {
    response = await guardedRequest(url, { headers: { accept: 'application/json' } });
  } catch (error) {
    if (error.cause === 'invalid_profile_url') throw error;
    throw ucpError('profile_unreachable', `Unable to fetch the platform profile: ${error.message}`);
  }
  if (response.status !== 200) {
    throw ucpError(
      'profile_unreachable',
      `The platform profile answered with status ${response.status}`,
    );
  }
  let profile: unknown;
  try {
    profile = JSON.parse(response.body.toString('utf8'));
  } catch {
    throw ucpError('profile_malformed', 'The platform profile is not JSON');
  }
  if (!isProfile(profile))
    throw ucpError('profile_malformed', 'The platform profile is not a UCP profile');

  const maxAge = Number(/max-age=(\d+)/.exec(response.headers['cache-control'] ?? '')?.[1] ?? 0);
  if (profiles.size >= 1000) profiles.delete(profiles.keys().next().value!);
  profiles.set(url, { profile, expires: Date.now() + Math.min(Math.max(maxAge, 60), 3600) * 1000 });
  return profile;
}

export function authorizePlatform(profile: string, user: User | undefined, options: UcpPluginOptions) {
  const platforms = options.platforms ?? [];
  const platform = platforms.find((entry) => entry.profile === profile);
  const claimed =
    Boolean(user?.username) && platforms.some((entry) => entry.username === user!.username);
  if ((platform?.username || claimed) && platform?.username !== user?.username) {
    throw ucpError(
      'unauthorized',
      'The credentials do not belong to the platform of the UCP-Agent profile',
    );
  }
  if (!platform && options.anonymous === false) {
    throw ucpError('profile_not_trusted', 'This business only serves registered platforms');
  }
  return platform;
}
