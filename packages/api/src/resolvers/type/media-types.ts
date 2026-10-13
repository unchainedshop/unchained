import type { GraphQLFieldResolver } from 'graphql';
import type { File as FileType } from '@unchainedshop/core-files';
import type { Context } from '../../context.ts';
import { checkAction } from '../../roles/acl.ts';
import { actions } from '../../roles/index.ts';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api');
export interface MediaHelperTypes {
  url: GraphQLFieldResolver<FileType, Context, Record<string, any>, Promise<string | null>>;
}

export const Media: MediaHelperTypes = {
  url: async (file, params, context, info) => {
    const { services } = context;
    try {
      await checkAction(context, actions.downloadFile, [file, params], info);
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
