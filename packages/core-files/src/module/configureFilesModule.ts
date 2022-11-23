import { ModuleInput, ModuleMutations } from '@unchainedshop/types/core';
import { File, FilesModule, FilesSettingsOptions } from '@unchainedshop/types/files';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbMutations } from '@unchainedshop/utils';
import { MediaObjectsCollection } from '../db/MediaObjectsCollection';
import { MediaObjectsSchema } from '../db/MediaObjectsSchema';
import { filesSettings } from '../files-settings';

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
      try {
        // If the url is absolute, return
        const finalURL = new URL(transformedURLString);
        return finalURL.href;
      } catch (e) {
        try {
          // else try to fix by using ROOT_URL env
          const finalURL = new URL(transformedURLString, process.env.ROOT_URL);
          return finalURL.href;
        } catch (err) {
          // else return the transformed string because it's not an URL
          return transformedURLString;
        }
      }
    },

    findFile: async ({ fileId }, options) => {
      return Files.findOne(generateDbFilterById(fileId), options);
    },

    findFiles: async (selector, options) => {
      return Files.find(selector, options).toArray();
    },

    deleteMany: async (fileIds) => {
      await Files.deleteMany({ _id: { $in: fileIds } });
    },

    create: async (doc: File, userId: string) => {
      const fileId = await mutations.create(doc, userId);
      emit('FILE_CREATE', { fileId });
      return fileId;
    },
    update: async (_id: string, doc: File, userId: string) => {
      const fileId = await mutations.update(_id, { $set: doc }, userId);
      emit('FILE_UPDATE', { fileId });
      return fileId;
    },
    delete: async (fileId: string, userId: string) => {
      const deletedCount = await mutations.delete(fileId, userId);
      emit('FILE_REMOVE', { fileId });
      return deletedCount;
    },
    deletePermanently: mutations.deletePermanently,
  };
};
