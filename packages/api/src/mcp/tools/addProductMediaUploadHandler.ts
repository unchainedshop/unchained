import { z } from 'zod';
import { Context } from '../../context.js';
import { log } from '@unchainedshop/logger';
import { FileNotFoundError, FileUploadExpiredError } from '../../errors.js';

export const AddProductMediaUploadSchema = {
  mediaName: z
    .string()
    .min(1)
    .describe('Name of the media file (e.g. "image.png") use random name if not provided'),
  productId: z.string().min(1).describe('ID of the product to link media to'),
  url: z.string().describe('Anonymously fetchable URL of the source media, can be a data URL too'),
};

export const AddProductMediaUploadZodSchema = z.object(AddProductMediaUploadSchema);

export type AddProductMediaUploadParams = z.infer<typeof AddProductMediaUploadZodSchema>;

export async function addProductMediaUploadHandler(
  context: Context,
  params: AddProductMediaUploadParams,
) {
  const { mediaName, productId, url } = params;
  const { modules, services, userId } = context;

  try {
    log('addProductMediaUploadHandler', { mediaName, productId, userId, url });
    const {
      _id: fileId,
      putURL,
      type,
      size,
    } = await services.files.createSignedURL({
      directoryName: 'product-media',
      fileName: mediaName,
      meta: { productId },
    });

    const sourceResponse = await fetch(url);
    console.log('Source response status:', sourceResponse);
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
            file: linked,
          }),
        },
      ],
    };
  } catch (error) {
    console.log(error);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error uploading product media: ${(error as Error).message}`,
        },
      ],
    };
  }
}
