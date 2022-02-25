export default async (readStream, writeStream) => {
  return new Promise((resolve, reject) => {
    try {
      readStream
        .on('error', (e) => {
          reject(e)
        })
        .pipe(writeStream)
        .on('error', (e) => {
          reject(e)
        })
        .on('finish', async (file) => {
          resolve(file)
        });
    } catch (e) {
      reject(e);
    }
  });
}
