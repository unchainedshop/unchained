import { Context } from '../../context.js';

export const WebAuthnCredentials = {
  async _id(obj: {
    id: string;
    publicKey: string;
    created: Date;
    aaguid: string;
    counter: number;
    mdsMetadata: any;
  }) {
    return obj.id;
  },
  async created(obj: {
    id: string;
    publicKey: string;
    created: Date;
    aaguid: string;
    counter: number;
    mdsMetadata: any;
  }) {
    return obj.created || new Date(0);
  },
  async mdsMetadata(
    obj: {
      id: string;
      publicKey: string;
      created: Date;
      aaguid: string;
      counter: number;
      mdsMetadata: any;
    },
    _: never,
    { modules }: Context,
  ) {
    const metadata = await modules.users.webAuthn.findMDSMetadataForAAGUID(obj.aaguid);
    return metadata;
  },
};
