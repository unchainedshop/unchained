import { IWorkerAdapter, Work } from '@unchainedshop/types/worker.js';
import { WorkerDirector, WorkerAdapter, WorkerEventTypes } from '@unchainedshop/core-worker';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import later from '@breejs/later';
import { subscribe } from '@unchainedshop/events';

const everyMinute = later.parse.cron('* * * * *');

export const UpdateTokenOwnership: IWorkerAdapter<void, void> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.update-token-ownership',
  label: 'External worker to update ownership of provided tokens',
  version: '1.0.0',
  type: 'UPDATE_TOKEN_OWNERSHIP',
  external: true,

  async doWork() {
    throw new Error('Cannot do work for external workers');
  },
};

export const RefreshTokens: IWorkerAdapter<void, any> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.refresh-tokens',
  label: 'Worker to refresh tokens for accounts',
  version: '1.0.0',
  type: 'REFRESH_TOKENS',
  external: false,

  async doWork(input, unchainedAPI) {
    const { modules } = unchainedAPI;

    const tokens = await modules.warehousing.findTokens({});
    const users = await modules.users.findUsers({ includeGuests: true, 'services.web3.verified': true });
    const accounts = users.flatMap((user) => {
      return user?.services?.web3?.flatMap((service) => {
        if (service.verified) return [service.address];
        return [];
      });
    });

    tokens.forEach((token) => {
      accounts.push(token.walletAddress);
    });

    if (!tokens?.length) {
      return { success: true, result: {} };
    }

    const forked = await modules.worker.addWork({
      type: 'UPDATE_TOKEN_OWNERSHIP',
      retries: 0,
      input: {
        filter: {
          tokens,
          accounts: [...new Set(accounts)],
        },
      },
    });
    return { success: true, result: { forked } };
  },
};

export const configureUpdateTokenOwnership = (unchainedAPI: UnchainedCore) => {
  subscribe<Work>(WorkerEventTypes.FINISHED, async ({ payload: work }) => {
    if (work.type === 'UPDATE_TOKEN_OWNERSHIP' && work.success) {
      await Promise.all(
        (work.result?.tokens || []).map(unchainedAPI.modules.warehousing.updateTokenOwnership),
      );
    }
  });
};

export default configureUpdateTokenOwnership;

WorkerDirector.registerAdapter(RefreshTokens);
WorkerDirector.registerAdapter(UpdateTokenOwnership);

WorkerDirector.configureAutoscheduling(RefreshTokens, {
  schedule: everyMinute,
  retries: 0,
});
