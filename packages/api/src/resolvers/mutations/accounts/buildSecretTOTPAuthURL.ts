import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function buildTOTPSecret(root: Root, _: any, { modules, userId }: Context) {
  log('mutation buildTOTPSecret', { userId });

  return modules.accounts.buildTOTPSecret();
}
