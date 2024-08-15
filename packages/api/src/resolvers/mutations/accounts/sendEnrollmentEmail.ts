import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

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
  } catch {
    return {
      success: false,
    };
  }
}
