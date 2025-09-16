import { experimental_generateImage, ImageModel, tool } from 'ai';
import { fileTypeFromBuffer } from 'file-type'; // TODO: replace with native solution when available
import { z } from 'zod';

const inputSchema = z.object({
  prompt: z.string().describe('The prompt to generate the image from'),
  size: z
    .enum([
      '512x512',
      '768x768',
      '1024x1024',
      '512x896',
      '640x1120',
      '768x1344',
      '1024x1792',
      '896x512',
      '1120x640',
      '1344x768',
      '1792x1024',
    ])
    .optional()
    .describe('The size of the image (default is 1024x1024).'),
});

const generateImageHandler =
  (req: any) =>
  ({
    model,
    uploadUrl = `${process.env.ROOT_URL}/temp-upload`,
  }: {
    model: ImageModel;
    uploadUrl?: string;
  }) => {
    return tool<any>({
      description: 'Generate an image based on the prompt',
      inputSchema: inputSchema as any,
      name: 'generate_image',
      execute: async ({ prompt, size = '1024x1024' }) => {
        try {
          const { image } = await experimental_generateImage({
            model,
            prompt,
            size: size as any,
          });

          const buffer = Buffer.from(image.base64, 'base64');
          const fileType = await fileTypeFromBuffer(buffer);
          const extension = fileType?.ext || 'png';
          const mime = fileType?.mime || 'image/png';

          const filename = `image-${Date.now()}.${extension}`;
          const file = new File([buffer], filename, { type: mime });
          const formData = new FormData();
          formData.append('image', file);

          const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
              Cookie: req?.headers?.cookie || req?.headers?.get('cookie') || '',
            },
          });

          if (!uploadRes.ok) {
            throw new Error(`Image upload failed: ${uploadRes.statusText}`);
          }

          const { url } = await uploadRes.json();
          return { imageUrl: url, prompt };
        } catch (error) {
          return `Error Generating image: ${(error as Error).message}`;
        }
      },
    });
  };

export default generateImageHandler;
