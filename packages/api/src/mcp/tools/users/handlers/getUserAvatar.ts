import type { Context } from '../../../../context.ts';
import normalizeMediaUrl from '../../../utils/normalizeMediaUrl.ts';
import type { Params } from '../schemas.ts';

export default async function getUserAvatar(context: Context, params: Params<'GET_AVATAR'>) {
  const { modules, loaders } = context;
  const { userId } = params;
  const user = await modules.users.findUserById(userId);
  if (!user?.avatarId) {
    return null;
  }

  const avatar = await loaders.fileLoader.load({
    fileId: user.avatarId,
  });

  return { avatar: await normalizeMediaUrl([{ mediaId: avatar._id as string } as any], context) };
}
