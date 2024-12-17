import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';

export interface WebAuthnCredentialsCreationRequest {
  challenge: string;
  username: string;
  origin: string;
  factor: 'first' | 'second' | 'either';
}

type Collection = WebAuthnCredentialsCreationRequest & { _id: number };

export const WebAuthnCredentialsCreationRequestsCollection = async (db: mongodb.Db) => {
  const WebAuthnCredentialsCreationRequests = db.collection<Collection>(
    'accounts_webauthn_credentials_creation_requests',
  );

  await buildDbIndexes<Collection>(WebAuthnCredentialsCreationRequests, [
    {
      index: {
        username: 1,
      },
    },
  ]);

  return WebAuthnCredentialsCreationRequests;
};
