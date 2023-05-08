import { Context } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';
import {
  AuthOperationFailedError,
  EmailAlreadyExistsError,
  UsernameAlreadyExistsError,
  UsernameOrEmailRequiredError,
} from '../../../errors.js';

const loginWithOAuth = async (
  _,
  {
    provider,
    authorizationCode,
    redirectUrl,
  }: { provider: string; authorizationCode: string; redirectUrl: string },
  context: Context,
): Promise<any | null> => {
  log(`mutation loginWithOAuth ${provider} ${authorizationCode}`);
  try {
    return context.modules.accounts.loginWithService(
      {
        service: 'oauth2',
        authorizationCode,
        provider,
        redirectUrl,
      },
      context,
    );
  } catch (e) {
    if (e.code === 'EmailAlreadyExists') throw new EmailAlreadyExistsError({});
    else if (e.code === 'UsernameAlreadyExists') throw new UsernameAlreadyExistsError({});
    else if (e.code === 'UsernameOrEmailRequired') throw new UsernameOrEmailRequiredError({});
    else throw new AuthOperationFailedError({});
  }
};

export default loginWithOAuth;
