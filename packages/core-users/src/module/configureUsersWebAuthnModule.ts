/// <reference lib="dom" />
import { ModuleInput } from '@unchainedshop/types/core.js';
import {
  Fido2Lib,
  PublicKeyCredentialCreationOptions,
  PublicKeyCredentialRequestOptions,
} from 'fido2-lib';
import { WebAuthnCredentialsCreationRequestsCollection } from '../db/WebAuthnCredentialsCreationRequestsCollection.js';

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

export function toArrayBuffer(buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

export function buf2hex(buffer) {
  // buffer is an ArrayBuffer
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => `00${x.toString(16)}`.slice(-2))
    .join('');
}

export const configureUsersWebAuthnModule = async ({ db }: ModuleInput<any>) => {
  const WebAuthnCredentialsCreationRequests = await WebAuthnCredentialsCreationRequestsCollection(db);

  const thisDomain = new URL(ROOT_URL).hostname;

  const f2l = new Fido2Lib({
    rpId: thisDomain,
    rpName: EMAIL_WEBSITE_NAME,
    rpIcon:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAARCSURBVHgB7Ve9UxNbFL8fm7yA4ktegHnlMk98dMbOMnR2D6pnGTqtCH+BWFoBpZXQaaelFbGzEztHHF26DKizzijDx+Zef+fu3vXuJgsxztjonQnZOZw993d+5zOM/epHslFO1a/KS/UbuvTnETsKQ/YDh3+XNi72yuVlzVgbL1YhCaOTk2ssDAI24hHDKsrpfxZkufwCj6t0OUAEBMkrlR6wHzjDMVCd872yemeete7gczeKoh2wQTICsyi0DrTWVc55eHqwu8OGPEMCMNSby5hS89H7Nx0Se9NXVvF1J69O7MDwJsKzgfCcmSP9SQhvxcV6S5cnummCHYVH4kJ9DE9NfHx1+HGLxKo0sSOkvIXHSnyz7mjOySufdLmUN3Vp4slZiSoyXk7NrhHVQui1fGzhzTq+QsZ5U07NtowQ3oH2FavDhXjS2389w7W+lrDgI2+2yfaZAEpT/y5LopjztnEkf1F6GXsc38TvWKO9g91NfO3EBGgjpxzooTosCISvXQjAm7zc1Fyvm7IChRHQM+uVcxGBAbstI84bVcqyUE3lAMyVWkrky0UsuGUYRqeni4zQk1cAk15ELxMYy07OqElKqo5ieVWWymsDAbhKGa9Qatag8P5omcQiUEot9nmb1c9cFkm5FJPJWqWp2UYegKkCMf7XHjRaeGwgs+9T1iPTA8ibkM/h5ev4XwVJthEd7D7kF+ozANRI9B9RlpO+lUO/IcZqz0jGPr8PUUFU7k185mwFZUIwBAuGUqWUob8nxCqLQ0H6qbeOnNmQGftOBVHO9QEw+ozZRKLE8y0wxDxFLISIE6n7KsDfjUS8kBoludZbCYBvl8XNaCMPLAOASsde5vYAlFPbeqWV+q/Pq5xR6HRS6zkWzPzIlXdmGKWXFaM/V06zwAGQaVppSJ3yzk7DAqpcb7UQD/q8cuRoxb75dtlxm5Zb3mzALEj7O7I/zWRUBRurHcO7G9Sw5MXJT+rLh+dmRlSqe6iOm1aOC/5nBELr2yTDOw3YO4Z+x3icq7iB01BMXm4j4dbIO+rtVi6nr7xLBg0tIjN20mGGbBPdVs+8J07mvcjzkbnbGf14tNNeYcb4wJVMH358jpo2zSf1lgCM1V4m6CsFXiUG9Iref9txe4kQXgVT9jqXejNZaEKAvFu4D5ikStBjus3bJcPxdjALNE8OduetHep+yIsXGQcZf9wTxyusGwSFS2mCvmaMcn6Lj9d9OV77BGN7iOuCYQFeqcMPT43+peln2IraFH/EdsvuALDTTTthvE0tIRnvsc/x/8/diIq2HnsSFoKEhXUAWM6zYA5VwoDtaLiV7O85XypFy+hVnbRlhCXoo9zZHWkpGWY3/L613D25PZFzeVVxvZqs6ywSYKZ7/ro+2g8TOu6eSBXAGfWIio2z2n871GY8OgN06BcSfitQuZr1CxuQ3Zh/6qkk0/P3GeV8BeBCYUHc/WHIAAAAAElFTkSuQmCC',
    challengeSize: 128,
    attestation: 'none',
  });

  return {
    findMDSMetadataForAAGUID: async (aaguid) => {
      const mdsCollection = await fetchMDS();
      const foundEntry = mdsCollection.find((entry) => {
        return entry.aaguid === aaguid;
      });
      return foundEntry?.metadataStatement;
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
