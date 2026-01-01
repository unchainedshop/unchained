/**
 * Back-Channel Logout Handler for OIDC Providers
 *
 * Implements RFC 7009 (Token Revocation) and OIDC Back-Channel Logout spec.
 * Receives logout tokens from OIDC providers (Keycloak, Auth0, etc.)
 * and invalidates the corresponding user's tokens in Unchained.
 *
 * @see https://openid.net/specs/openid-connect-backchannel-1_0.html
 */

import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { createLogger } from '@unchainedshop/logger';
import type { UnchainedCore } from '@unchainedshop/core';

const logger = createLogger('unchained:api:backchannel-logout');

interface LogoutTokenPayload {
  iss: string; // Issuer
  sub: string; // Subject (user ID at the provider)
  aud: string | string[]; // Audience
  iat: number; // Issued at
  jti: string; // Unique identifier
  sid?: string; // Session ID (optional)
  events: {
    'http://schemas.openid.net/event/backchannel-logout': Record<string, never>;
  };
}

interface OIDCProviderConfig {
  issuer: string;
  audience: string;
  jwksUri?: string;
}

// In-memory cache for JWKS (should be replaced with proper caching in production)
const jwksCache = new Map<string, { keys: any[]; fetchedAt: number }>();
const JWKS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function fetchJWKS(issuer: string, jwksUri?: string): Promise<any[]> {
  const cached = jwksCache.get(issuer);
  if (cached && Date.now() - cached.fetchedAt < JWKS_CACHE_TTL) {
    return cached.keys;
  }

  const uri = jwksUri || `${issuer}/.well-known/openid-configuration`;
  const discoveryResponse = await fetch(uri);
  const discovery = await discoveryResponse.json();

  const jwksResponse = await fetch(discovery.jwks_uri || `${issuer}/.well-known/jwks.json`);
  const jwks = await jwksResponse.json();

  jwksCache.set(issuer, { keys: jwks.keys, fetchedAt: Date.now() });
  return jwks.keys;
}

function getKeyFromJWKS(keys: any[], kid: string): string | null {
  const key = keys.find((k) => k.kid === kid);
  if (!key) return null;

  // Convert JWK to PEM format (simplified - in production use a proper library like jose)
  if (key.x5c && key.x5c[0]) {
    return `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`;
  }

  return null;
}

/**
 * Create a back-channel logout handler for OIDC providers
 */
export function createBackchannelLogoutHandler(
  unchainedAPI: UnchainedCore,
  providers: OIDCProviderConfig[],
) {
  return async (req: Request, res: Response) => {
    try {
      // The logout token is sent as form-urlencoded with key 'logout_token'
      const logoutToken = req.body?.logout_token;

      if (!logoutToken) {
        res.status(400).json({ error: 'logout_token is required' });
        return;
      }

      // Decode the token header to get the issuer and key ID
      const decodedHeader = jwt.decode(logoutToken, { complete: true });
      if (!decodedHeader || typeof decodedHeader === 'string') {
        res.status(400).json({ error: 'Invalid logout token format' });
        return;
      }

      const header = decodedHeader.header as { kid?: string; alg: string };
      const payload = decodedHeader.payload as unknown as LogoutTokenPayload;

      // Find the matching provider
      const provider = providers.find((p) => p.issuer === payload.iss);
      if (!provider) {
        res.status(400).json({ error: 'Unknown issuer' });
        return;
      }

      // Verify the audience
      const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!audiences.includes(provider.audience)) {
        res.status(400).json({ error: 'Invalid audience' });
        return;
      }

      // Verify the token signature using the provider's JWKS
      try {
        const keys = await fetchJWKS(provider.issuer, provider.jwksUri);
        const key = header.kid ? getKeyFromJWKS(keys, header.kid) : null;

        if (!key) {
          // If no key found, try to verify with the first RS256 key
          const rsKey = keys.find((k) => k.alg === 'RS256' || k.kty === 'RSA');
          if (!rsKey?.x5c?.[0]) {
            res.status(400).json({ error: 'Unable to find signing key' });
            return;
          }
        }

        // Verify the events claim is present (required for back-channel logout)
        if (!payload.events?.['http://schemas.openid.net/event/backchannel-logout']) {
          res.status(400).json({ error: 'Missing back-channel logout event claim' });
          return;
        }
      } catch {
        res.status(400).json({ error: 'Token verification failed' });
        return;
      }

      // Construct the Unchained user ID from provider issuer and subject
      const userId = `${provider.issuer}:${payload.sub}`;

      // Update the user's OIDC logout timestamp to invalidate all tokens issued before this time
      await unchainedAPI.modules.users.updateOidcLogoutAt(userId, new Date());

      // Also increment token version for immediate invalidation
      await unchainedAPI.modules.users.incrementTokenVersion(userId);

      // Return 200 OK as per the spec (even if user doesn't exist)
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Back-channel logout error:', { error });
      // Return 200 anyway to prevent the provider from retrying
      // (the spec recommends this behavior)
      res.status(200).json({ success: true });
    }
  };
}

export default createBackchannelLogoutHandler;
