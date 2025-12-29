import { type ModuleInput, generateDbObjectId } from '@unchainedshop/mongodb';
import { createLogger } from '@unchainedshop/logger';
import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';
import { server as webauthnServer } from '@passwordless-id/webauthn';
import type {
  RegistrationJSON,
  AuthenticationJSON,
  CredentialInfo,
  NamedAlgo,
  ExtendedAuthenticatorTransport,
} from '@passwordless-id/webauthn/dist/esm/types.js';
import { WebAuthnCredentialsCreationRequestsCollection } from '../db/WebAuthnCredentialsCreationRequestsCollection.ts';

const logger = createLogger('unchained:core-users');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Re-export types for consumers
export type {
  RegistrationJSON,
  AuthenticationJSON,
  CredentialInfo,
  NamedAlgo,
  ExtendedAuthenticatorTransport,
};

// MDS (Metadata Service) types and fetcher
interface MDSEntry {
  aaguid?: string;
  metadataStatement?: {
    description?: string;
    icon?: string;
    authenticatorGetInfo?: {
      versions?: string[];
      extensions?: string[];
      options?: Record<string, boolean>;
    };
    [key: string]: unknown;
  };
}

async function fetchMDSEntriesImpl(): Promise<Map<string, MDSEntry>> {
  const cache = new Map<string, MDSEntry>();
  try {
    // Fetch the MDS blob from FIDO Alliance
    const response = await fetch('https://mds.fidoalliance.org/');
    if (!response.ok) {
      logger.warn('Failed to fetch FIDO MDS', { status: response.status });
      return cache;
    }

    const jwtBlob = await response.text();
    // The MDS is a JWT - we just need to decode the payload (middle part)
    const parts = jwtBlob.split('.');
    if (parts.length !== 3) {
      logger.warn('Invalid MDS JWT format');
      return cache;
    }

    // Decode base64url payload
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    const mdsData = JSON.parse(decoded);

    // Index entries by AAGUID
    if (Array.isArray(mdsData.entries)) {
      for (const entry of mdsData.entries) {
        if (entry.aaguid) {
          cache.set(entry.aaguid.toLowerCase(), entry);
        }
      }
    }

    logger.debug(`Loaded ${cache.size} MDS entries`);
  } catch (error) {
    logger.warn('Error fetching MDS', { error: error.message });
  }

  return cache;
}

// Memoize MDS fetch with 24-hour expiration using expiry-map
const mdsCache = new ExpiryMap(ONE_DAY_MS);
const fetchMDSEntries = pMemoize(fetchMDSEntriesImpl, { cache: mdsCache });

export function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

export function buf2hex(buffer: ArrayBuffer): string {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x: number) => `00${x.toString(16)}`.slice(-2))
    .join('');
}

export interface WebAuthnCredentialCreationOptions {
  challenge: string;
  requestId: string;
  rp: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: { type: 'public-key'; alg: number }[];
  timeout: number;
  attestation: 'none' | 'indirect' | 'direct';
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    requireResidentKey?: boolean;
    userVerification?: 'required' | 'preferred' | 'discouraged';
  };
}

export interface WebAuthnCredentialRequestOptions {
  challenge: string;
  requestId: string;
  rpId: string;
  timeout: number;
  userVerification?: 'required' | 'preferred' | 'discouraged';
  allowCredentials?: {
    id: string;
    type: 'public-key';
    transports?: ('usb' | 'nfc' | 'ble' | 'internal')[];
  }[];
}

export interface WebAuthnCredential {
  id: string;
  publicKey: string;
  algorithm: NamedAlgo;
  aaguid: string;
  counter: number;
  created: Date;
}

export const configureUsersWebAuthnModule = async ({ db }: ModuleInput<Record<string, any>>) => {
  const { ROOT_URL = 'http://localhost:4010', EMAIL_WEBSITE_NAME = 'Unchained' } = process.env;

  const WebAuthnCredentialsCreationRequests = await WebAuthnCredentialsCreationRequestsCollection(db);

  const thisDomain = new URL(ROOT_URL).hostname;
  const thisOrigin = new URL(ROOT_URL).origin;

  return {
    findMDSMetadataForAAGUID: async (aaguid: string) => {
      const mdsEntries = await fetchMDSEntries();
      const entry = mdsEntries.get(aaguid.toLowerCase());
      return entry?.metadataStatement || null;
    },

    createCredentialCreationOptions: async (
      origin: string,
      username: string,
      extensionOptions?: {
        timeout?: number;
        authenticatorSelection?: WebAuthnCredentialCreationOptions['authenticatorSelection'];
      },
    ): Promise<WebAuthnCredentialCreationOptions> => {
      const challenge = webauthnServer.randomChallenge();
      const { insertedId } = await WebAuthnCredentialsCreationRequests.insertOne({
        _id: generateDbObjectId(),
        challenge,
        origin,
        factor: 'either',
        username,
      });

      return {
        challenge,
        requestId: insertedId,
        rp: {
          id: thisDomain,
          name: EMAIL_WEBSITE_NAME,
        },
        user: {
          id: username,
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        timeout: extensionOptions?.timeout || 60000,
        attestation: 'none',
        authenticatorSelection: extensionOptions?.authenticatorSelection || {
          userVerification: 'preferred',
        },
      };
    },

    createCredentialRequestOptions: async (
      origin: string,
      username: string,
      extensionOptions?: {
        timeout?: number;
        userVerification?: 'required' | 'preferred' | 'discouraged';
        allowCredentials?: WebAuthnCredentialRequestOptions['allowCredentials'];
      },
    ): Promise<WebAuthnCredentialRequestOptions> => {
      const challenge = webauthnServer.randomChallenge();
      const { insertedId } = await WebAuthnCredentialsCreationRequests.insertOne({
        _id: generateDbObjectId(),
        challenge,
        origin,
        factor: 'either',
        username,
      });

      return {
        challenge,
        requestId: insertedId,
        rpId: thisDomain,
        timeout: extensionOptions?.timeout || 60000,
        userVerification: extensionOptions?.userVerification || 'preferred',
        allowCredentials: extensionOptions?.allowCredentials,
      };
    },

    verifyCredentialCreation: async (
      username: string,
      credentials: RegistrationJSON,
    ): Promise<WebAuthnCredential | null> => {
      const request = await WebAuthnCredentialsCreationRequests.findOne(
        {
          username,
        },
        { sort: { _id: -1 } },
      );
      if (!request) {
        logger.error('WebAuthn: No credential creation request found for username', { username });
        return null;
      }

      const expectedOrigin = request.origin || thisOrigin;
      logger.info('WebAuthn: Verifying credential creation', {
        username,
        expectedOrigin,
        expectedChallenge: request.challenge,
        credentialId: credentials.id,
      });

      try {
        const registrationInfo = await webauthnServer.verifyRegistration(credentials, {
          challenge: request.challenge,
          origin: expectedOrigin,
        });

        logger.info('WebAuthn: Credential creation verified successfully', {
          username,
          credentialId: registrationInfo.credential.id,
        });

        return {
          id: registrationInfo.credential.id,
          publicKey: registrationInfo.credential.publicKey,
          algorithm: registrationInfo.credential.algorithm,
          aaguid: registrationInfo.authenticator.aaguid,
          counter: registrationInfo.authenticator.counter,
          created: new Date(),
        };
      } catch (error) {
        logger.error('WebAuthn credential creation verification failed', {
          error: error.message,
          username,
          expectedOrigin,
          expectedChallenge: request.challenge,
        });
        return null;
      }
    },

    verifyCredentialRequest: async (
      userPublicKeys: {
        id: string;
        publicKey: string;
        algorithm?: NamedAlgo;
        counter?: number;
        transports?: ExtendedAuthenticatorTransport[];
      }[],
      username: string,
      credentials: AuthenticationJSON & { requestId: string },
    ): Promise<{ userHandle: string; counter: number } | null> => {
      const request = await WebAuthnCredentialsCreationRequests.findOne(
        {
          _id: credentials.requestId,
        },
        { sort: { _id: -1 } },
      );
      if (!request) return null;

      const matchingKey = userPublicKeys.find((key) => key.id === credentials.id);
      if (!matchingKey) return null;

      try {
        const credentialKey: CredentialInfo = {
          id: matchingKey.id,
          publicKey: matchingKey.publicKey,
          algorithm: matchingKey.algorithm || 'ES256',
          transports: matchingKey.transports || [],
        };

        const authenticationInfo = await webauthnServer.verifyAuthentication(
          credentials,
          credentialKey,
          {
            challenge: request.challenge,
            origin: request.origin || thisOrigin,
            userVerified: false, // Don't require user verification
            counter: matchingKey.counter,
          },
        );

        return {
          userHandle: credentials.response.userHandle || username,
          counter: authenticationInfo.counter,
        };
      } catch (error) {
        logger.debug('WebAuthn credential request verification failed', { error: error.message });
        return null;
      }
    },

    deleteUserWebAuthnCredentials: async (username: string) => {
      const { deletedCount } = await WebAuthnCredentialsCreationRequests.deleteMany({
        username,
      });
      return deletedCount;
    },
  };
};

export type UsersWebAuthnModule = Awaited<ReturnType<typeof configureUsersWebAuthnModule>>;
