import { ModuleInput, ModuleMutations } from '@unchainedshop/types/core.js';
import { File, FilesModule, FilesSettingsOptions } from '@unchainedshop/types/files.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbMutations } from '@unchainedshop/mongodb';
import { MediaObjectsCollection } from '../db/MediaObjectsCollection.js';
import { MediaObjectsSchema } from '../db/MediaObjectsSchema.js';
import { filesSettings } from '../files-settings.js';

const FILE_EVENTS: string[] = ['FILE_CREATE', 'FILE_UPDATE', 'FILE_REMOVE'];

export const configureFilesModule = async ({
  db,
  options: filesOptions = {},
}: ModuleInput<FilesSettingsOptions>): Promise<FilesModule> => {
  registerEvents(FILE_EVENTS);

  // Settings
  await filesSettings.configureSettings(filesOptions);

  const Files = await MediaObjectsCollection(db);

  const mutations = generateDbMutations<File>(Files, MediaObjectsSchema, {
    permanentlyDeleteByDefault: true,
  }) as ModuleMutations<File>;

  return {
    getUrl: (file, params) => {
      if (!file?.url) return null;
      const transformedURLString = filesSettings.transformUrl(file.url, params);
      if (URL.canParse(transformedURLString)) {
        const finalURL = new URL(transformedURLString);
        return finalURL.href;
      } else if (URL.canParse(transformedURLString, process.env.ROOT_URL)) {
        const finalURL = new URL(transformedURLString, process.env.ROOT_URL);
        return finalURL.href;
      }
      return transformedURLString;
    },

    findFile: async ({ fileId }, options) => {
      return Files.findOne(generateDbFilterById(fileId), options);
    },

    findFiles: async (selector, options) => {
      return Files.find(selector, options).toArray();
    },

    deleteMany: async (fileIds) => {
      const deletionResult = await Files.deleteMany({ _id: { $in: fileIds } });
      return deletionResult.deletedCount;
    },

    create: async (doc: File) => {
      const fileId = await mutations.create(doc);
      await emit('FILE_CREATE', { fileId });
      return fileId;
    },
    update: async (_id: string, doc: File) => {
      const fileId = await mutations.update(_id, { $set: doc });
      await emit('FILE_UPDATE', { fileId });
      return fileId;
    },
    delete: async (fileId: string) => {
      const deletedCount = await mutations.delete(fileId);
      await emit('FILE_REMOVE', { fileId });
      return deletedCount;
    },
    deletePermanently: mutations.deletePermanently,
  };
};
