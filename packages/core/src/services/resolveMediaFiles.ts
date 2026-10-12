import type { File } from '@unchainedshop/core-files';
import type { Modules } from '../modules.ts';
import { createFileDownloadURLService } from './createFileDownloadURL.ts';

export async function resolveMediaFilesService<Media extends { mediaId: string }>(
  this: Modules,
  medias: Media[],
): Promise<(Media & { file: File & { url: string } })[]> {
  const resolvedMedias = await Promise.all(
    medias.map(async (media) => {
      const file = await this.files.findFile({ fileId: media.mediaId });
      const url = file && (await createFileDownloadURLService.bind(this)({ file }));
      return url ? { ...media, file: { ...file, url } } : null;
    }),
  );
  return resolvedMedias.filter((media) => media !== null);
}
