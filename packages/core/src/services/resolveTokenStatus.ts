import type { TokenSurrogate, TokenStatus as TokenStatusType } from '@unchainedshop/core-warehousing';
import { TokenStatus } from '@unchainedshop/core-warehousing';
import { WorkStatus } from '@unchainedshop/core-worker';
import type { Modules } from '../modules.ts';

export async function resolveTokenStatusService(
  this: Modules,
  {
    token,
  }: {
    token: TokenSurrogate;
  },
): Promise<TokenStatusType> {
  if (token.walletAddress && !token.userId) {
    return TokenStatus.DECENTRALIZED;
  }

  const workItems = await this.worker.findWorkQueue({
    types: ['EXPORT_TOKEN'],
    status: [WorkStatus.NEW, WorkStatus.ALLOCATED],
  });

  if (workItems.find((item) => item.input?.token?._id === token._id)) {
    return TokenStatus.EXPORTING;
  }

  return TokenStatus.CENTRALIZED;
}
