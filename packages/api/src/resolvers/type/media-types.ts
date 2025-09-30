import { File as FileType, getFileAdapter } from '@unchainedshop/core-files';
import { Context } from '../../context.js';
import { checkAction } from '../../acl.js';
import { actions } from '../../roles/index.js';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api');
export interface MediaHelperTypes {
  url: (language: FileType, params: Record<string, any>, context: Context) => Promise<string | null>;
}

export const Media: MediaHelperTypes = {
  url: async (file, params, context) => {
    const { modules } = context;
    try {
      await checkAction(context, actions.downloadFile, [file, params]);
      if (!file) return null;
      const fileUploadAdapter = getFileAdapter();
      const url = await fileUploadAdapter.createDownloadURL(file, params?.expires);
      if (!url) throw new Error('Could not create download URL');
      return modules.files.normalizeUrl(url, params);
    } catch (e) {
      logger.error(e);
      return null;
    }
  },
};
