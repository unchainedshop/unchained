import { AccountsSettingsOptions, AccountsWebAuthnModule } from '@unchainedshop/types/accounts';
import { ModuleInput } from '@unchainedshop/types/core';
import {
  Fido2Lib,
  PublicKeyCredentialCreationOptions,
  PublicKeyCredentialRequestOptions,
} from 'fido2-lib';
import fetch from 'node-fetch';

import { WebAuthnCredentialsCreationRequestsCollection } from '../db/WebAuthnCredentialsCreationRequestsCollection';

const { ROOT_URL, EMAIL_WEBSITE_NAME } = process.env;

type SerializedOptions<T> = Omit<T, 'challenge' | 'requestId'> & {
  challenge: string;
  requestId: number;
};

let setupMDSPromise;
const setupMDSCollection = async () => {
  const tocResult = await fetch('https://mds.fidoalliance.org');
  const tocBase64 = await tocResult.text();
  const mc = (Fido2Lib as any).createMdsCollection('FIDO MDS v3'); // createMdsCollection exists but not typed in official package!
  const tocObj = await mc.addToc(tocBase64);
  return tocObj.entries;
};

const fetchMDS = async () => {
  if (setupMDSPromise) return setupMDSPromise;
  setupMDSPromise = setupMDSCollection();
  return setupMDSPromise;
};

function toArrayBuffer(buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

function buf2hex(buffer) {
  // buffer is an ArrayBuffer
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => `00${x.toString(16)}`.slice(-2))
    .join('');
}

export const configureAccountsWebAuthnModule = async ({
  db,
}: ModuleInput<AccountsSettingsOptions>): Promise<AccountsWebAuthnModule> => {
  const WebAuthnCredentialsCreationRequests = await WebAuthnCredentialsCreationRequestsCollection(db);

  const thisDomain = new URL(ROOT_URL).hostname;

  const f2l = new Fido2Lib({
    rpId: thisDomain,
    rpName: EMAIL_WEBSITE_NAME,
  });

  return {
    findMDSMetadataForAAGUID: async (aaguid) => {
      const mdsCollection = await fetchMDS();
      const entry = mdsCollection.find((entry) => {
        return entry.aaguid === aaguid;
      });
      return entry?.metadataStatement;
    },

    createCredentialCreationOptions: async (origin, username, extensionOptions) => {
      const registrationOptions = await f2l.attestationOptions(extensionOptions);
      const challenge = Buffer.from(registrationOptions.challenge).toString('base64');
      const { insertedId } = await WebAuthnCredentialsCreationRequests.insertOne({
        _id: new Date().getTime(),
        challenge,
        origin,
        factor: (registrationOptions as any).factor || 'either',
        username,
      });

      return {
        ...registrationOptions,
        challenge,
        requestId: insertedId,
      } as SerializedOptions<PublicKeyCredentialCreationOptions>;
    },

    createCredentialRequestOptions: async (origin, username, extensionOptions) => {
      const loginOptions = await f2l.assertionOptions(extensionOptions);
      const challenge = Buffer.from(loginOptions.challenge).toString('base64');
      const { insertedId } = await WebAuthnCredentialsCreationRequests.insertOne({
        _id: new Date().getTime(),
        challenge,
        origin,
        factor: (loginOptions as any).factor || 'either',
        username,
      });

      return {
        ...loginOptions,
        challenge,
        requestId: insertedId,
      } as SerializedOptions<PublicKeyCredentialRequestOptions>;
    },

    verifyCredentialCreation: async (username, credentials) => {
      const request = await WebAuthnCredentialsCreationRequests.findOne(
        {
          username,
        },
        { sort: { _id: -1 } },
      );

      const attestationExpectations = {
        challenge: request.challenge,
        origin: request.origin,
        factor: request.factor,
      };

      const id = Buffer.from(credentials.id, 'base64');
      const attestationObject = Buffer.from(credentials.response.attestationObject, 'base64');
      const clientDataJSON = Buffer.from(credentials.response.clientDataJSON, 'base64');

      const attestationResponse = {
        id: toArrayBuffer(id),
        response: {
          attestationObject: toArrayBuffer(attestationObject),
          clientDataJSON: toArrayBuffer(clientDataJSON),
        },
      };

      const registrationOptions = await f2l.attestationResult(
        attestationResponse,
        attestationExpectations,
      );

      const publicKey = registrationOptions?.authnrData?.get('credentialPublicKeyPem');
      const aaguidArrayBuffer = registrationOptions?.authnrData?.get('aaguid'); // ArrayBuffer Uint8...
      const counter = registrationOptions?.authnrData?.get('counter');

      const aaguidConcatenated = buf2hex(aaguidArrayBuffer);
      const aaguid = `${aaguidConcatenated.slice(0, 8)}-${aaguidConcatenated.slice(
        8,
        12,
      )}-${aaguidConcatenated.slice(12, 16)}-${aaguidConcatenated.slice(
        16,
        20,
      )}-${aaguidConcatenated.slice(20)}`;

      return { publicKey, counter, id: credentials.id, aaguid, created: new Date() };
    },

    verifyCredentialRequest: async (userPublicKeys, username, credentials) => {
      const request = await WebAuthnCredentialsCreationRequests.findOne(
        {
          _id: credentials.requestId,
        },
        { sort: { _id: -1 } },
      );

      const id = Buffer.from(credentials.id, 'base64');
      const authenticatorData = Buffer.from(credentials.response.authenticatorData, 'base64');
      const signature = Buffer.from(credentials.response.signature, 'base64');
      const userHandle = Buffer.from(credentials.response.userHandle, 'base64');
      const clientDataJSON = Buffer.from(credentials.response.clientDataJSON, 'base64');

      const { publicKey, counter } =
        userPublicKeys.find((publicCredentials) => {
          return credentials.id === publicCredentials.id;
        }) || {};

      if (!publicKey) throw new Error('WebAuthn not setup');

      const assertionExpectations = {
        challenge: request.challenge,
        origin: request.origin,
        factor: request.factor,
        prevCounter: counter,
        publicKey,
        userHandle: toArrayBuffer(Buffer.from(username)),
      };

      const assertionResponse = {
        id: toArrayBuffer(id),
        response: {
          authenticatorData: toArrayBuffer(authenticatorData),
          clientDataJSON: toArrayBuffer(clientDataJSON),
          signature: toArrayBuffer(signature),
          userHandle: toArrayBuffer(userHandle),
        },
      };

      const loginResult = await f2l.assertionResult(assertionResponse, assertionExpectations);
      return { userHandle: loginResult?.authnrData?.get('userHandle') };
    },
  };
};
