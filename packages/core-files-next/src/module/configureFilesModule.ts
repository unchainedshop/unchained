import { ModuleInput } from '@unchainedshop/types/common';
import { File, FilesModule, UploadFileData } from '@unchainedshop/types/files';
import { ListIndexesCursor } from '@unchainedshop/types/node_modules/mongodb';
import { emit, registerEvents } from 'meteor/unchained:events';
import {
  generateDbMutations,
  generateDbFilterById,
} from 'meteor/unchained:utils';
import { FileDirector } from 'src/director/FileDirector';
import { FilesCollection } from '../db/FilesCollection';
import { FilesSchema } from '../db/FilesSchema';

const FILE_EVENTS: string[] = ['FILE_CREATE', 'FILE_UPDATE', 'FILE_REMOVE'];

const getFileFromFileData = (fileData: UploadFileData, meta: any) => ({
  externalFileId: encodeURIComponent(
    `${fileData.directoryName}/${fileData.hash}`
  ),
  expires: meta.expiryDate || fileData.expiryDate,
  name: fileData.fileName,
  size: fileData.size,
  tpye: fileData.type,
  url: fileData.url,
  meta,
});

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

    // Plugin
    createSignedURL: async (directoryName, fileName, meta) => {
      const uploadFileData = await FileDirector.createSignedURL(
        directoryName,
        fileName
      );
      const file = getFileFromFileData(uploadFileData, meta);

      const fileId = await mutations.insert(file);

      return await Files.findOne(generateDbFilterById(fileId));
    },

    removeFiles: async (fileIds) => {
      if (typeof fileIds !== 'string' && !Array.isArray(fileIds))
        throw Error(
          'Media id/s to be removed not provided as a string or array'
        );

      const idList = [];

      if (typeof fileIds === 'string') {
        const file = await Files.findOne({ externalFileId: fileIds });
        idList.push(FileDirector.composeFileName(file));
      } else {
        const files = Files.find(
          { externalFileId: { $in: fileIds } },
          {
            projection: {
              _id: 1,
              externalFieldId: 1,
              url: 1,
            },
          }
        );
        const ids = await files.map(FileDirector.composeFileName).toArray();
        idList.push(...ids);
      }

      await FileDirector.removeFiles(idList);

      const deletedFilesResult = await Files.deleteMany({
        externalFileId: {
          $in: typeof fileIds === 'string' ? [fileIds] : fileIds,
        },
      });

      return deletedFilesResult.deletedCount;
    },

    uploadFileFromStream: async (directoryName, rawFile, meta) => {
      const uploadFileData = await FileDirector.uploadFileFromStream(
        directoryName,
        rawFile
      );
      const file = getFileFromFileData(uploadFileData, meta);

      const fileId = await mutations.insert(file);

      return await Files.findOne(generateDbFilterById(fileId));
    },

    uploadFileFromURL: async (directoryName, fileInput, meta) => {
      const uploadFileData = await FileDirector.uploadFileFromURL(
        directoryName,
        fileInput
      );
      const file = getFileFromFileData(uploadFileData, meta);

      const fileId = await mutations.insert(file);

      return await Files.findOne(generateDbFilterById(fileId));
    },

    linkFile: async ({ externalFileId, size, type }) => {
      const file = await Files.findOne({ externalFileId });

      if (!file)
        throw new Error(`Media with external id ${externalFileId} Not found`);

      const { meta } = file;
      const { mediaId, ...mediaMeta } = meta;
      if (!mediaId) return null;
      
      const [mediaType] = decodeURIComponent(externalFileId).split('/');

      await Files.updateOne(
        { _id: file._id },
        {
          $set: {
            size,
            type,
            expires: null,
            updated: new Date(),
          },
        }
      );

      await mediaContainerRegistry[mediaType](mediaUploadTicketId, mediaId, {
        ...mediaMeta,
      });

      return await Files.findOne({ _id: file._id });
    },
  };
};
