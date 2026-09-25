import { type IPlugin } from '@unchainedshop/core';
import { UpdateTokenOwnership, RefreshTokens, configureRefreshTokensAutoscheduling } from './adapter.ts';

// Plugin definition
export const UpdateTokenOwnershipPlugin: IPlugin = {
  key: 'shop.unchained.worker.update-token-ownership',
  label: 'Update Token Ownership Worker Plugin',
  version: '1.0.0',

  adapters: [UpdateTokenOwnership, RefreshTokens],

  onRegister: () => {
    configureRefreshTokensAutoscheduling();
  },
};

export default UpdateTokenOwnershipPlugin;

// Helpers
export { configureRefreshTokensAutoscheduling } from './adapter.ts';
