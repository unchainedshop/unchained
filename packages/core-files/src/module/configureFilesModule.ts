import { ModuleInput } from '@unchainedshop/mongodb';
import { File } from '../types.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbObjectId, mongodb } from '@unchainedshop/mongodb';
import { MediaObjectsCollection } from '../db/MediaObjectsCollection.js';
import { filesSettings, FilesSettingsOptions } from '../files-settings.js';

const FILE_EVENTS: string[] = ['FILE_CREATE', 'FILE_UPDATE', 'FILE_REMOVE'];

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
      const transformedURLString = filesSettings.transformUrl(url, params);
      if (URL.canParse(transformedURLString)) {
        const finalURL = new URL(transformedURLString);
        return finalURL.href;
      } else if (URL.canParse(transformedURLString, process.env.ROOT_URL)) {
        const finalURL = new URL(transformedURLString, process.env.ROOT_URL);
        return finalURL.href;
      }
      return transformedURLString;
    },

    findFile: async (
      { fileId }: { fileId?: string },
      options?: mongodb.FindOptions<File>,
    ): Promise<File> => {
      return Files.findOne(generateDbFilterById(fileId), options);
    },

    findFiles: async (
      selector: mongodb.Filter<File>,
      options?: mongodb.FindOptions<File>,
    ): Promise<Array<File>> => {
      return Files.find(selector, options).toArray();
    },

    deleteMany: async (fileIds: Array<string>): Promise<number> => {
      const deletionResult = await Files.deleteMany({ _id: { $in: fileIds } });
      return deletionResult.deletedCount;
    },

    create: async (doc: File) => {
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

    delete: async (fileId: string) => {
      const { deletedCount } = await Files.deleteOne({ _id: fileId });
      await emit('FILE_REMOVE', { fileId });
      return deletedCount;
    },
  };
};

export type FilesModule = Awaited<ReturnType<typeof configureFilesModule>>;
