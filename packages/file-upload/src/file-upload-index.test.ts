import buildHashedFilename from './build-hashed-filename.js';

describe('File Uploader', () => {
  it('Generate unique file name', async () => {
    expect(
      await buildHashedFilename('root', 'file1.jpg', new Date(new Date('2022-12-04T17:13:09.285Z'))),
    ).toEqual('NFJAbVaH6tRDuGDn4IPZYqh0AP-file1.jpg');
  });
});
