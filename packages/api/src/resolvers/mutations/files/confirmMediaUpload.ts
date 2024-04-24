import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';
import { FileUploadExpiredError, FileNotFoundError } from '../../../errors.js';

export default async function confirmMediaUpload(
  root: Root,
  { mediaUploadTicketId: fileId, size, type },
  context: Context,
) {
  const { services, modules, userId } = context;

  log(`mutation confirmMediaUpload `, { userId });

  const file = await modules.files.findFile({ fileId });
  if (!file) throw new FileNotFoundError({ fileId });

  if (file.expires && new Date(file.expires).getTime() < new Date().getTime())
    throw new FileUploadExpiredError({ fileId });

  return services.files.linkFile({ fileId, size, type }, context);
}
