import type { File as FileType } from '@unchainedshop/core-files';
import type { Context } from '../../context.ts';
import { checkAction } from '../../acl.ts';
import { actions } from '../../roles/index.ts';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api');
export interface MediaHelperTypes {
  url: (language: FileType, params: Record<string, any>, context: Context) => Promise<string | null>;
}

export const Media: MediaHelperTypes = {
  url: async (file, params, context) => {
    const { services } = context;
    try {
      await checkAction(context, actions.downloadFile, [file, params]);
      if (!file) return null;
      const url = await services.files.createFileDownloadURL({
        file,
        expires: params?.expires,
        params,
      });
      if (!url) throw new Error('Could not create download URL');
      return url;
    } catch (e) {
      logger.error(e);
      return null;
    }
  },
};
