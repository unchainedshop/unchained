import { ModuleInput, ModuleMutations, Query } from '@unchainedshop/types/common';
import { File, FilesModule } from '@unchainedshop/types/files';
import { emit, registerEvents } from 'meteor/unchained:events';
import { generateDbFilterById, generateDbMutations } from 'meteor/unchained:utils';
import { MediaObjectsCollection } from '../db/MediaObjectsCollection';
import { MediaObjectsSchema } from '../db/MediaObjectsSchema';
import { getFileAdapter } from '../utils/getFileAdapter';

const FILE_EVENTS: string[] = ['FILE_CREATE', 'FILE_UPDATE', 'FILE_REMOVE'];

export const configureFilesModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<FilesModule> => {
  registerEvents(FILE_EVENTS);

  const Files = await MediaObjectsCollection(db);

  const fileUploadAdapter = getFileAdapter();

  const mutations = generateDbMutations<File>(Files, MediaObjectsSchema) as ModuleMutations<File>;

  return {
    findFile: async ({ fileId }, options) => {
      return Files.findOne(generateDbFilterById(fileId), options);
    },

    findFiles: async (selector) => {
      return Files.find(selector).toArray();
    },

    deleteMany: async (fileIds, userId) => {
      await Promise.all(
        fileIds.map(async (fileId) => {
          await mutations.delete(fileId, userId);
          emit('FILE_REMOVE', { fileId });
        }),
      );
    },

    findFilesByMetaData: async ({ meta }, options) => {
      const metaKeys = Object.keys(meta);

      if (metaKeys.length === 0) return [];

      const selector: Query = metaKeys.reduce(
        (currentSelector, key) =>
          meta[key] !== undefined
            ? {
                ...currentSelector,
                [`meta.${key}`]: meta[key],
              }
            : currentSelector,
        {},
      );

      const files = Files.find(selector, options);

      return files.toArray();
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
    delete: async (fileId, userId) => {
      const deletedCount = await mutations.delete(fileId, userId);
      emit('FILE_REMOVE', { fileId });
      return deletedCount;
    },
  };
};
