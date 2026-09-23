import type { File } from '@unchainedshop/core-files';
import type { Modules } from '../modules.ts';
import { createFileDownloadURLService } from './createFileDownloadURL.ts';

type ResolvedMedia<TMedia> = TMedia & { file: File & { url: string } };

export async function resolveMediaFilesService<TMedia extends { mediaId: string }>(
  this: Modules,
  medias: TMedia[],
): Promise<ResolvedMedia<TMedia>[]> {
  const resolved = new Array<ResolvedMedia<TMedia> | undefined>(medias.length);
  await Promise.all(
    medias.map(async (media, index) => {
      try {
        const file = await this.files.findFile({ fileId: media.mediaId });
        if (!file) return;
        const url = await createFileDownloadURLService.bind(this)({ file });
        if (url) {
          resolved[index] = { ...media, file: { ...file, url } } as ResolvedMedia<TMedia>;
        }
      } catch {
        // Broken media references should not make an otherwise valid entity unreadable.
      }
    }),
  );

  const available: ResolvedMedia<TMedia>[] = [];
  for (const media of resolved) {
    if (media) available.push(media);
  }
  return available;
}
