import type { Modules } from '../modules.ts';
import { createFileDownloadURLService } from './createFileDownloadURL.ts';

export async function resolveMediaFilesService(this: Modules, medias: { mediaId: string }[]) {
  const files = await this.files.findFiles({ fileIds: medias.map(({ mediaId }) => mediaId) });
  const resolvedMedias = await Promise.all(
    medias.map(async (media) => {
      const file = files.find(({ _id }) => _id === media.mediaId);
      const url = file && (await createFileDownloadURLService.bind(this)({ file }));
      return url ? { ...media, file: { ...file, url } } : null;
    }),
  );
  return resolvedMedias.filter((media) => media !== null);
}
