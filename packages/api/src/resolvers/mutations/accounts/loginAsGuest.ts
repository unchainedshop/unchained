import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function loginAsGuest(root: never, _: any, context: Context) {
  log('mutation loginAsGuest');

  const { user } = await context.services.users.provisionGuest({
    countryCode: context.countryCode,
    lastLogin: {
      remoteAddress: context.remoteAddress,
      remotePort: context.remotePort,
      userAgent: context.getHeader('user-agent'),
      locale: context.locale?.baseName,
      countryCode: context.countryCode,
    },
  });

  return context.login(user);
}
