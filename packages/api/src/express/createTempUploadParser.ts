import multer from 'multer';

export const TEMP_UPLOAD_MAX_FILE_SIZE = 1024 * 1024 * 35; // 35MB, same as the fastify route

export default function createTempUploadParser() {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      // Without a size limit the whole body is buffered in memory before the handler
      // (and therefore before the permission check) ever runs.
      fileSize: TEMP_UPLOAD_MAX_FILE_SIZE,
      files: 1,
      parts: 10,
      // Multer otherwise accepts arbitrarily large sparse-array indexes, even
      // on patched versions. Reject them before append-field can block the CPU.
      fieldArrayIndexLimit: 100,
    },
  });
}
