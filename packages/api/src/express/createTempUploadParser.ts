import multer from 'multer';

export default function createTempUploadParser() {
  return multer({
    storage: multer.memoryStorage(),
    // Multer otherwise accepts arbitrarily large sparse-array indexes, even
    // on patched versions. Reject them before append-field can block the CPU.
    limits: { fieldArrayIndexLimit: 100 },
  });
}
