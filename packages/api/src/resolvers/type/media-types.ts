import { File as FileType } from '@unchainedshop/core-files';
import { Context } from '../../context.js';

export interface MediaHelperTypes {
  url: (language: FileType, params: Record<string, any>, context: Context) => string;
}

export const Media: MediaHelperTypes = {
  url(root, params, { modules }) {
    return modules.files.getUrl(root, params);
  },
};
