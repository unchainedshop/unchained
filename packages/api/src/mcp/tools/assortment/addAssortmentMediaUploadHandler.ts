import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { FileNotFoundError, FileUploadExpiredError } from '../../../errors.js';
import normalizeMediaUrl from '../../utils/normalizeMediaUrl.js';

export const AddAssortmentMediaUploadSchema = {
  mediaName: z
    .string()
    .min(1)
    .describe('Name of the media file (e.g., "image.png"). A random name will be used if not provided.'),
  assortmentId: z.string().min(1).describe('ID of the assortment to link the media to.'),
  url: z.string().describe('Anonymously fetchable URL of the media file.'),
};

export const AddAssortmentMediaUploadZodSchema = z.object(AddAssortmentMediaUploadSchema);

export type AddAssortmentMediaUploadParams = z.infer<typeof AddAssortmentMediaUploadZodSchema>;

export async function addAssortmentMediaUploadHandler(
  context: Context,
  params: AddAssortmentMediaUploadParams,
) {
  const { mediaName, assortmentId, url } = params;
  const { modules, services, userId } = context;

  try {
    log('handler addAssortmentMediaUploadHandler', { params, userId });
    const {
      _id: fileId,
      putURL,
      type,
      size,
    } = await services.files.createSignedURL({
      directoryName: 'assortment-media',
      fileName: mediaName,
      meta: { assortmentId },
    });

    const sourceResponse = await fetch(url);
    const uploadUrl = new URL(putURL, process.env.ROOT_URL || 'http://localhost:4010');
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: sourceResponse.body,
      duplex: 'half',
    } as RequestInit);

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    const file = await modules.files.findFile({ fileId });
    if (!file) throw new FileNotFoundError({ fileId });

    if (file.expires && new Date(file.expires).getTime() < Date.now()) {
      throw new FileUploadExpiredError({ fileId });
    }
    const linked = await services.files.linkFile({ fileId, size, type });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            file: await normalizeMediaUrl([{ ...linked, mediaId: linked._id }], context),
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error uploading Assortment media: ${(error as Error).message}`,
        },
      ],
    };
  }
}
