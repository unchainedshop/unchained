import { Context } from '@unchainedshop/types/api.js';
import { WebAuthnCredentials as WebAuthnCredentialsTypes } from '@unchainedshop/types/user.js';

type HelperType<P, T> = (
  credentials: WebAuthnCredentialsTypes,
  params: P,
  context: Context,
) => Promise<T>;

export interface WebAuthnCredentialsHelperTypes {
  _id: HelperType<any, string>;
  created: HelperType<any, Date>;
  mdsMetadata: HelperType<any, any>;
}

export const WebAuthnCredentials: WebAuthnCredentialsHelperTypes = {
  async _id(obj) {
    return obj.id;
  },
  async created(obj) {
    return obj.created || new Date(0);
  },
  async mdsMetadata(obj, _, { modules }) {
    const metadata = await modules.users.webAuthn.findMDSMetadataForAAGUID(obj.aaguid);
    return metadata;
  },
};
