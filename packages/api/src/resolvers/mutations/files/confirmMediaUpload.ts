import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';
import { FileLinkExpiredFoundError, FileNotFoundError } from '../../../errors.js';

export default async function confirmMediaUpload(
  root: Root,
  { mediaUploadTicketId, size, type },
  context: Context,
) {
  const { services, userId } = context;

  log(`mutation confirmMediaUpload `, { userId });
  let file;
  try {
    file = await services.files.linkFile({ fileId: mediaUploadTicketId, size, type }, context);
    return file;
  } catch (e) {
    if (e?.message?.includes('File link has expired'))
      throw new FileLinkExpiredFoundError({ mediaUploadTicketId });
    if (e?.message?.includes('not found')) throw new FileNotFoundError({ mediaUploadTicketId });

    return file;
  }
}
