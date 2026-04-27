import type { UnchainedCore } from '@unchainedshop/core';
import type { TokenSurrogate, TokenStatus as TokenStatusType } from '@unchainedshop/core-warehousing';
import { TokenStatus } from '@unchainedshop/core-warehousing';
import { WorkStatus } from '@unchainedshop/core-worker';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ token: TokenSurrogate }, TokenStatusType>(async (queries) => {
    const tokensNeedingWorkCheck: TokenSurrogate[] = [];

    for (const { token } of queries) {
      if (!(token.walletAddress && !token.userId)) {
        tokensNeedingWorkCheck.push(token);
      }
    }

    let exportingTokenIds: Set<string>;
    if (tokensNeedingWorkCheck.length > 0) {
      const workItems = await unchainedAPI.modules.worker.findWorkQueue({
        types: ['EXPORT_TOKEN'],
        status: [WorkStatus.NEW, WorkStatus.ALLOCATED],
      });
      exportingTokenIds = new Set(workItems.map((item) => item.input?.token?._id).filter(Boolean));
    } else {
      exportingTokenIds = new Set();
    }

    return queries.map(({ token }) => {
      if (token.walletAddress && !token.userId) {
        return TokenStatus.DECENTRALIZED;
      }
      if (exportingTokenIds.has(token._id)) {
        return TokenStatus.EXPORTING;
      }
      return TokenStatus.CENTRALIZED;
    });
  });
