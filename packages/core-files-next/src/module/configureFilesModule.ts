import { ModuleInput } from '@unchainedshop/types/common';
import { File, FilesModule } from '@unchainedshop/types/files';
import { emit, registerEvents } from 'meteor/unchained:events';
import {
  generateDbMutations,
  generateDbFilterById,
} from 'meteor/unchained:utils';
import { FilesCollection } from '../db/FilesCollection';
import { FilesSchema } from '../db/FilesSchema';

const FILE_EVENTS: string[] = ['FILE_CREATE', 'FILE_UPDATE', 'FILE_REMOVE'];

export const configureFilesModule = async ({
  db,
}: ModuleInput): Promise<FilesModule> => {
  registerEvents(FILE_EVENTS);

  const Files = await FilesCollection(db);

  const mutations = generateDbMutations<File>(Files, FilesSchema);

  return {
    findFile: async ({ fileId, externalFileId }, options) => {
      return await Files.findOne(
        fileId ? generateDbFilterById(fileId) : { externalFileId },
        options
      );
    },

    create: async (doc: File, userId: string) => {
      const fileId = await mutations.create(doc, userId);
      emit('FILE_CREATE', { fileId });
      return fileId;
    },
    update: async (_id: string, doc: File, userId: string) => {
      const fileId = await mutations.update(_id, doc, userId);
      emit('FILE_UPDATE', { fileId });
      return fileId;
    },
    delete: async (fileId, userId) => {
      const deletedCount = await mutations.delete(fileId, userId);
      emit('FILE_REMOVE', { fileId });
      return deletedCount;
    },

    // Adapter
  };
};
