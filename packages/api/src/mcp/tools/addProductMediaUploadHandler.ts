import { z } from 'zod';
import { Context } from '../../context.js';
import { log } from '@unchainedshop/logger';
import { FileNotFoundError, FileUploadExpiredError } from '../../errors.js';

export const AddProductMediaUploadSchema = {
  mediaName: z.string().min(1).describe('Name of the media file (e.g. "image.png")'),
  productId: z.string().min(1).describe('ID of the product to link media to'),
  url: z.string().describe('Base64-encoded file content (data URL or plain base64)'),
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
    log('addProductMediaUploadHandler', { mediaName, productId, userId });
    const {
      _id: fileId,
      url: putURL,
      type,
      size,
    } = await services.files.createSignedURL({
      directoryName: 'product-media',
      fileName: mediaName,
      meta: { productId },
    });

    const base64 = url.includes(',') ? url.split(',')[1] : url;
    const buffer = Buffer.from(base64, 'base64');

    const uploadRes = await fetch(putURL, {
      method: 'PUT',
      body: buffer,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
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
            uploaded: true,
            confirmed: true,
            file: linked,
          }),
        },
      ],
    };
  } catch (error) {
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
