import { WebAuthnCredentialsCreationRequest } from '../types.js';
import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';

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
