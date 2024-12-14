import { filesSettings, File as FileType, getFileAdapter } from '@unchainedshop/core-files';
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
      const fileUploadAdapter = getFileAdapter();
      const mediaUrl = modules.files.getUrl(file, params);
      if (file.isPrivate) {
        const expiryTimestamp = new Date(
          new Date().getTime() + (filesSettings?.privateFileSharingMaxAge || 0),
        ).getTime();
        return fileUploadAdapter.signUrl(mediaUrl, file._id, expiryTimestamp);
      } else {
        return mediaUrl;
      }
    } catch (e) {
      console.error(e);
      return null;
    }
  },
};
