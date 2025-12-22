import type { ModuleInput } from '@unchainedshop/mongodb';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbObjectId, mongodb } from '@unchainedshop/mongodb';
import { MediaObjectsCollection, type File } from '../db/MediaObjectsCollection.ts';
import { filesSettings, type FilesSettingsOptions } from '../files-settings.ts';

const FILE_EVENTS: string[] = ['FILE_CREATE', 'FILE_UPDATE', 'FILE_REMOVE'];

export interface FileQuery {
  fileIds?: string[];
  excludeFileId?: string;
  path?: string;
  paths?: string[];
  meta?: Record<string, any>;
  createdBefore?: Date;
}

export const configureFilesModule = async ({
  db,
  options: filesOptions = {},
}: ModuleInput<FilesSettingsOptions>) => {
  registerEvents(FILE_EVENTS);

  // Settings
  await filesSettings.configureSettings(filesOptions);

  const Files = await MediaObjectsCollection(db);

  return {
    normalizeUrl: (url: string, params: Record<string, any>): string => {
      const { ROOT_URL = 'http://localhost:4010' } = process.env;

      const transformedURLString = filesSettings.transformUrl(url, params);
      if (URL.canParse(transformedURLString)) {
        const finalURL = new URL(transformedURLString);
        return finalURL.href;
      } else if (URL.canParse(transformedURLString, ROOT_URL)) {
        const finalURL = new URL(transformedURLString, ROOT_URL);
        return finalURL.href;
      }
      return transformedURLString;
    },

    findFile: async (params: { fileId: string } | { url: string }, options?: mongodb.FindOptions) => {
      if ('url' in params) {
        return Files.findOne({ url: params.url }, options);
      }
      return Files.findOne(generateDbFilterById(params.fileId), options);
    },

    findFiles: async (query: FileQuery, options?: mongodb.FindOptions): Promise<File[]> => {
      const selector: mongodb.Filter<File> = {};
      if (query.fileIds) {
        selector._id = { $in: query.fileIds };
      }
      if (query.excludeFileId) {
        selector._id = { $ne: query.excludeFileId };
      }
      if (query.path) {
        selector.path = query.path;
      }
      if (query.paths) {
        selector.path = { $in: query.paths };
      }
      if (query.meta) {
        Object.entries(query.meta).forEach(([key, value]) => {
          selector[`meta.${key}`] = value;
        });
      }
      if (query.createdBefore) {
        selector.created = { $lt: query.createdBefore };
      }
      return Files.find(selector, options).toArray();
    },

    deleteMany: async (fileIds: string[]): Promise<number> => {
      const deletionResult = await Files.deleteMany({ _id: { $in: fileIds } });
      return deletionResult.deletedCount;
    },

    create: async (doc: Omit<File, '_id' | 'created'> & Pick<Partial<File>, '_id' | 'created'>) => {
      const { insertedId: fileId } = await Files.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        ...doc,
      });
      await emit('FILE_CREATE', { fileId });
      return fileId;
    },

    update: async (fileId: string, doc: Partial<File>) => {
      await Files.updateOne(
        { _id: fileId },
        {
          $set: {
            updated: new Date(),
            ...doc,
          },
        },
      );
      await emit('FILE_UPDATE', { fileId });
      return fileId;
    },

    unexpire: async (fileId: string) => {
      await Files.updateOne(
        { _id: fileId },
        {
          $set: {
            updated: new Date(),
          },
          $unset: { expires: 1 },
        },
      );
      await emit('FILE_UPDATE', { fileId });
      return fileId;
    },

    delete: async (fileId: string) => {
      const { deletedCount } = await Files.deleteOne({ _id: fileId });
      await emit('FILE_REMOVE', { fileId });
      return deletedCount;
    },
  };
};

export type FilesModule = Awaited<ReturnType<typeof configureFilesModule>>;
