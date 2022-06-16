import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function sendEnrollmentEmail(
  root: Root,
  { email }: { email: string },
  { modules, userId }: Context,
) {
  log('mutation sendEnrollmentEmail', { email, userId });

  try {
    await modules.accounts.sendEnrollmentEmail(email);
    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
    };
  }
}
