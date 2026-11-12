import type { User } from '@unchainedshop/core-users';
import type { Modules } from '../modules.ts';

const hasLoginOfItsOwn = (user: User) =>
  Boolean(
    user.services?.password?.pbkdf2 ||
    user.services?.password?.bcrypt ||
    user.services?.webAuthn?.length,
  );

const hasVerifiedAddress = (user: User, email: string) =>
  Boolean(
    user.emails?.some(
      ({ address, verified }) =>
        verified && address?.trim().toLowerCase() === email.trim().toLowerCase(),
    ),
  );

export async function sendLoginCodeService(this: Modules, email: string): Promise<boolean> {
  const user = await this.users.findUserByEmail(email);
  if (!user || user.deleted) return false;
  if (!hasVerifiedAddress(user, email) && hasLoginOfItsOwn(user)) return false;
  return Boolean(await this.users.loginCode.createChallenge({ userId: user._id, email }));
}
