import buildHashedFilename from "./build-hashed-filename.js";


describe('File Uploader', () => {
  it('Generate unique file name', async () => {
    expect(buildHashedFilename('root', 'file1.jpg', new Date(new Date("2022-12-04T17:13:09.285Z")))).toEqual("4hI2YuPDacR8ERoR7iM6cQ-file1.jpg")
  });
});
