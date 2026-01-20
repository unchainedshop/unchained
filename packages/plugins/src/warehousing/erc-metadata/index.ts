import type { IPlugin } from '@unchainedshop/core';
import { ercMetadataHandler } from './api.ts';

const { ERC_METADATA_API_PATH = '/erc-metadata' } = process.env;

// Plugin definition
// Note: This plugin has routes only, no adapter
export const ERCMetadataPlugin: IPlugin = {
  key: 'shop.unchained.warehousing.erc-metadata',
  label: 'ERC Metadata Plugin',
  version: '1.0.0',

  routes: [
    {
      path: `${ERC_METADATA_API_PATH}/:productId/:localeOrTokenFilename{/:tokenFileName}`,
      method: 'GET',
      handler: ercMetadataHandler,
    },
  ],
};

export default ERCMetadataPlugin;
