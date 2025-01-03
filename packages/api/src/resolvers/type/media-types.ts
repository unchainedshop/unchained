import { File as FileType, getFileAdapter } from '@unchainedshop/core-files';
import { Context } from '../../context.js';
import { checkAction } from '../../acl.js';
import { actions } from '../../roles/index.js';
export interface MediaHelperTypes {
  url: (language: FileType, params: Record<string, any>, context: Context) => Promise<string>;
}

export const Media: MediaHelperTypes = {
  url: async (file, params, context) => {
    const { modules } = context;
    try {
      await checkAction(context, actions.downloadFile, [file, params]);
      if (!file) return null;
      const fileUploadAdapter = getFileAdapter();
      const url = await fileUploadAdapter.createDownloadURL(file, params?.expires);
      return modules.files.normalizeUrl(url, params);
    } catch (e) {
      console.error(e);
      return null;
    }
  },
};
