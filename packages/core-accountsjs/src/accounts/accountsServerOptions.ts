import { Context } from '@unchainedshop/types/api';
import { User } from '@unchainedshop/types/user';

export const accountsServerOptions = (requestContext: Context) => ({
  db: requestContext.modules.accounts.dbManager,
  useInternalUserObjectSanitizer: false,
  siteUrl: process.env.ROOT_URL,
  prepareMail: (to: string, token: string, user: User & { id: string }, pathFragment: string) => {
    return {
      template: 'ACCOUNT_ACTION',
      recipientEmail: to,
      action: pathFragment,
      userId: user.id || user._id,
      token,
      skipMessaging: !!user.guest && pathFragment === 'verify-email',
    };
  },
  sendMail: (input: any) => {
    if (!input) return true;
    if (input.skipMessaging) return true;

    return requestContext.modules.worker.addWork(
      {
        type: 'MESSAGE',
        retries: 0,
        input,
      },
      requestContext.userId,
    );
  },
});
