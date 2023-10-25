import { WebAuthnCredentialsCreationRequest } from '@unchainedshop/types/user.js';
import { Db } from '@unchainedshop/types/common.js';
import { buildDbIndexes } from '@unchainedshop/utils';

type Collection = WebAuthnCredentialsCreationRequest & { _id: number };

export const WebAuthnCredentialsCreationRequestsCollection = async (db: Db) => {
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
