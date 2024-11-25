import { File as FileType } from '@unchainedshop/core-files';
import { Context } from '../../context.js';
import { checkAction } from '../../acl.js';
import { actions } from '../../roles/index.js';

export interface MediaHelperTypes {
  url: (language: FileType, params: Record<string, any>, context: Context) => Promise<string>;
}

export const Media: MediaHelperTypes = {
  url: async (root, params, context) => {
    const { modules } = context;
    await checkAction(context, actions.downloadFile, [root, params]);
    return modules.files.getUrl(root, params);
  },
};
