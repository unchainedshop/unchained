import { describe, it } from 'node:test';
import assert from 'node:assert';
import buildHashedFilename from './build-hashed-filename.ts';

describe('File Uploader', () => {
  it('Generate unique file name', async () => {
    assert.equal(
      await buildHashedFilename('root', 'file1.jpg', new Date(new Date('2022-12-04T17:13:09.285Z'))),
      'NFJAbVaH6tRDuGDn4IPZYqh0AP-file1.jpg',
    );
  });
});
