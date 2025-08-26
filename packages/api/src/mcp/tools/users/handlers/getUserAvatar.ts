import { Context } from '../../../../context.js';
import normalizeMediaUrl from '../../../utils/normalizeMediaUrl.js';
import { Params } from '../schemas.js';

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

  return { avatar: await normalizeMediaUrl([avatar], context) };
}
