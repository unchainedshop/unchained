import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default function buildTOTPSecret(
  root: Root,
  _: any,
  { modules, userId }: Context
) {
  log('mutation buildTOTPSecret', { userId });

  return modules.accounts.buildTOTPSecret();
}
