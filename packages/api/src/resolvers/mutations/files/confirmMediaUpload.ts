import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';

export default async function confirmMediaUpload(
  root: Root,
  { mediaUploadTicketId, size, type },
  context: Context,
) {
  const { services, userId } = context;

  log(`mutation confirmMediaUpload `, { userId });

  return services.files.linkFile({ fileId: mediaUploadTicketId, size, type }, context);
}
