import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';

export default async function getUserAvatar(context: Context, params: Params<'GET_AVATAR'>) {
  const { modules, services } = context;
  const { userId } = params;
  const user = await modules.users.findUserById(userId);
  if (!user?.avatarId) {
    return null;
  }

  return {
    avatar: await services.files.resolveMediaFiles([{ mediaId: user.avatarId }]),
  };
}
