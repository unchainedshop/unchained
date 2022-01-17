import {
  ModuleInput,
  ModuleMutations,
  Query,
} from '@unchainedshop/types/common';
import { File, FilesModule, UploadFileData } from '@unchainedshop/types/files';
import { emit, registerEvents } from 'meteor/unchained:events';
import {
  generateDbFilterById,
  generateDbMutations,
} from 'meteor/unchained:utils';
import FileUpload from 'meteor/unchained:director-file-upload';
import { MediaObjectsCollection } from '../db/MediaObjectsCollection';
import { MediaObjectsSchema } from '../db/MediaObjectsSchema';

const FILE_EVENTS: string[] = ['FILE_CREATE', 'FILE_UPDATE', 'FILE_REMOVE'];

const getFileFromFileData = (fileData: UploadFileData, meta: any) => ({
  externalId: encodeURIComponent(`${fileData.directoryName}/${fileData.hash}`),
  expires: meta.expiryDate || fileData.expiryDate,
  name: fileData.fileName,
  size: fileData.size,
  tpye: fileData.type,
  url: fileData.url,
  meta,
});

export const configureFilesModule = async ({
  db,
}: ModuleInput<{}>): Promise<FilesModule> => {
  registerEvents(FILE_EVENTS);

  const Files = await MediaObjectsCollection(db);

  const mutations = generateDbMutations<File>(
    Files,
    MediaObjectsSchema
  ) as ModuleMutations<File>;

  return {
    findFile: async ({ fileId, externalId }, options) => {
      return await Files.findOne(
        fileId ? generateDbFilterById(fileId) : { externalId },
        options
      );
    },

    findFilesByMetaData: async ({ meta }, options) => {
      const metaKeys = Object.keys(meta);

      if (metaKeys.length === 0) return [];

      let selector: Query = metaKeys.reduce(
        (currentSelector, key) =>
          meta[key] !== undefined
            ? {
                ...currentSelector,
                [`meta.${key}`]: meta[key],
              }
            : currentSelector,
        {}
      );

      const files = Files.find(selector, options);

      return await files.toArray();
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

    // Plugin
    createSignedURL: async (
      { directoryName, fileName, meta },
      userId,
      uploadFileCallback
    ) => {
      const uploadFileData = await FileUpload.createSignedURL({
        directoryName,
        fileName,
      });
      const file = getFileFromFileData(uploadFileData, meta);

      const fileId = await mutations.create(file, userId);

      FileUpload.registerFileUploadCallback(directoryName, uploadFileCallback);

      return await Files.findOne(generateDbFilterById(fileId));
    },

    removeFiles: async ({ externalFileIds, excludedFileIds }) => {
      if (
        externalFileIds &&
        typeof externalFileIds !== 'string' &&
        !Array.isArray(externalFileIds)
      )
        throw Error(
          'Media id/s to be removed not provided as a string or array'
        );

      const selector: Query = excludedFileIds
        ? { _id: { $nin: excludedFileIds } }
        : {};

      if (externalFileIds) {
        if (typeof externalFileIds === 'string') {
          selector.externalId = externalFileIds;
        } else {
          selector.externalId = { externalId: { $in: externalFileIds } };
        }
      }

      const files = Files.find(selector, {
        projection: {
          _id: 1,
          externalFieldId: 1,
          url: 1,
        },
      });

      const idList = await files.map(FileUpload.composeFileName).toArray();

      await FileUpload.removeFiles(idList);

      const deletedFilesResult = await Files.deleteMany(selector);

      return deletedFilesResult.deletedCount;
    },

    uploadFileFromStream: async ({ directoryName, rawFile, meta }, userId) => {
      const uploadFileData = await FileUpload.uploadFileFromStream(
        directoryName,
        rawFile
      );
      const file = getFileFromFileData(uploadFileData, meta);

      const fileId = await mutations.create(file, userId);

      return await Files.findOne(generateDbFilterById(fileId));
    },

    uploadFileFromURL: async (directoryName, fileInput, meta, userId) => {
      const uploadFileData = await FileUpload.uploadFileFromURL(
        directoryName,
        fileInput
      );
      const file = getFileFromFileData(uploadFileData, meta);

      const fileId = await mutations.create(file, userId);

      return await Files.findOne(generateDbFilterById(fileId));
    },
  };
};
