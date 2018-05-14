const {
  FILE_STORAGE_PATH,
} = process.env;

export default (subdir) => {
  if (FILE_STORAGE_PATH) {
    return `${FILE_STORAGE_PATH}/${subdir}`;
  }
  return `assets/app/uploads/${subdir}`;
};
