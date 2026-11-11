import { userSettings } from '@unchainedshop/core-users';
import type { Modules } from '../modules.ts';

export async function requestLoginCodeService(this: Modules, email: string) {
  const address = email.trim().toLowerCase();
  if (!userSettings.loginCode.enabled || !address.includes('@') || address.length > 255) return;
  await this.worker.addWork({ type: 'LOGIN_CODE', input: { email: address }, retries: 0 });
}
