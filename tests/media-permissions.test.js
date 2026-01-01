import { setupDatabase, putFile, disconnect } from './helpers.js';
import { sql } from '@unchainedshop/store';
import {
  Admin,
  ADMIN_TOKEN,
  User,
  UnverifiedUser,
  USER_TOKEN,
  GUEST_TOKEN,
  Guest,
} from './seeds/users.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert';

const dirname = path.dirname(fileURLToPath(import.meta.url));

let createLoggedInGraphqlFetch;
let createAnonymousGraphqlFetch;
let adminGraphqlFetch;
let loggedInGraphqlFetch;
let anonymousGraphqlFetch;
let guestGraphqlFetch;
let db;

const userAvatarFile1 = fs.createReadStream(path.resolve(dirname, `./assets/zurich.jpg`));
const userAvatar2 = fs.createReadStream(path.resolve(dirname, `./assets/contract.pdf`));

test.describe('Media Permissions', () => {
  test.before(async () => {
    ({ createLoggedInGraphqlFetch, createAnonymousGraphqlFetch, db } = await setupDatabase());
    adminGraphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    loggedInGraphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);
    anonymousGraphqlFetch = createAnonymousGraphqlFetch();
    guestGraphqlFetch = createLoggedInGraphqlFetch(GUEST_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test(
    'Mutation.prepareUserAvatarUpload for admin user: returns a sign PUT url',
    { timeout: 10000 },
    async () => {
      const {
        data: { prepareUserAvatarUpload },
      } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation prepareUserAvatarUpload($mediaName: String!, $userId: ID!) {
            prepareUserAvatarUpload(mediaName: $mediaName, userId: $userId) {
              _id
              putURL
              expires
            }
          }
        `,
        variables: {
          mediaName: 'test-media.jpg',
          userId: Admin._id,
        },
      });

      assert.ok(prepareUserAvatarUpload.putURL);
    },
  );

  test('Mutation.prepareUserAvatarUpload for admin user: links uploaded avatar file with user successfully', async () => {
    const {
      data: { prepareUserAvatarUpload },
    } = await adminGraphqlFetch(
      {
        query: /* GraphQL */ `
          mutation prepareUserAvatarUpload($mediaName: String!, $userId: ID!) {
            prepareUserAvatarUpload(mediaName: $mediaName, userId: $userId) {
              _id
              putURL
              expires
            }
          }
        `,
        variables: {
          mediaName: 'test-media.jpg',
          userId: Admin._id,
        },
      },
      10000,
    );

    await putFile(userAvatarFile1, {
      url: prepareUserAvatarUpload.putURL,
      type: 'image/jpeg',
    });

    const {
      data: { confirmMediaUpload },
    } = await adminGraphqlFetch({
      query: /* GraphQL */ `
        mutation confirmMediaUpload($mediaUploadTicketId: ID!, $size: Int!, $type: String!) {
          confirmMediaUpload(mediaUploadTicketId: $mediaUploadTicketId, size: $size, type: $type) {
            _id
            name
            type
            size
          }
        }
      `,
      variables: {
        mediaUploadTicketId: prepareUserAvatarUpload._id,
        size: 38489,
        type: 'image/jpeg',
      },
    });
    assert.deepStrictEqual(confirmMediaUpload, {
      _id: prepareUserAvatarUpload._id,
      name: 'test-media.jpg',
      type: 'image/jpeg',
      size: 38489,
    });
  });

  test(
    'Mutation.prepareUserAvatarUpload for VERIFIED USER user: returns a sign PUT url',
    { timeout: 10000 },
    async () => {
      const {
        data: { prepareUserAvatarUpload },
      } = await loggedInGraphqlFetch({
        query: /* GraphQL */ `
          mutation prepareUserAvatarUpload($mediaName: String!, $userId: ID!) {
            prepareUserAvatarUpload(mediaName: $mediaName, userId: $userId) {
              _id
              putURL
              expires
            }
          }
        `,
        variables: {
          mediaName: 'test-media.jpg',
          userId: User._id,
        },
      });
      assert.ok(prepareUserAvatarUpload.putURL);
    },
  );

  test('Mutation.prepareUserAvatarUpload for VERIFIED USER user: links uploaded avatar file with user successfully', async () => {
    const {
      data: { prepareUserAvatarUpload },
    } = await loggedInGraphqlFetch(
      {
        query: /* GraphQL */ `
          mutation prepareUserAvatarUpload($mediaName: String!, $userId: ID!) {
            prepareUserAvatarUpload(mediaName: $mediaName, userId: $userId) {
              _id
              putURL
              expires
            }
          }
        `,
        variables: {
          mediaName: 'test-media.jpg',
          userId: User._id,
        },
      },
      10000,
    );

    await putFile(userAvatar2, {
      url: prepareUserAvatarUpload.putURL,
      type: 'image/jpeg',
    });

    const {
      data: { confirmMediaUpload },
    } = await loggedInGraphqlFetch({
      query: /* GraphQL */ `
        mutation confirmMediaUpload($mediaUploadTicketId: ID!, $size: Int!, $type: String!) {
          confirmMediaUpload(mediaUploadTicketId: $mediaUploadTicketId, size: $size, type: $type) {
            _id
            name
            type
            size
          }
        }
      `,
      variables: {
        mediaUploadTicketId: prepareUserAvatarUpload._id,
        size: 8615,
        type: 'image/jpeg',
      },
    });
    assert.deepStrictEqual(confirmMediaUpload, {
      _id: prepareUserAvatarUpload._id,
      name: 'test-media.jpg',
      size: 8615,
      type: 'image/jpeg',
    });
  });

  test(
    'Mutation.prepareUserAvatarUpload for Logged in UNVERIFIED user: returns NoPermissionError error',
    { timeout: 10000 },
    async () => {
      const { errors } = await loggedInGraphqlFetch({
        query: /* GraphQL */ `
          mutation prepareUserAvatarUpload($mediaName: String!, $userId: ID!) {
            prepareUserAvatarUpload(mediaName: $mediaName, userId: $userId) {
              _id
              putURL
              expires
            }
          }
        `,
        variables: {
          mediaName: 'test-media.jpg',
          userId: UnverifiedUser._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    },
  );

  test(
    'Mutation.prepareUserAvatarUpload for ANONYMOUS user: returns NoPermissionError error',
    { timeout: 10000 },
    async () => {
      const { errors } = await anonymousGraphqlFetch({
        query: /* GraphQL */ `
          mutation prepareUserAvatarUpload($mediaName: String!, $userId: ID!) {
            prepareUserAvatarUpload(mediaName: $mediaName, userId: $userId) {
              _id
              putURL
              expires
            }
          }
        `,
        variables: {
          mediaName: 'test-media.jpg',
          userId: Guest._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    },
  );

  test(
    'Mutation.prepareUserAvatarUpload for GUEST user: returns NoPermissionError error',
    { timeout: 10000 },
    async () => {
      const { errors } = await guestGraphqlFetch({
        query: /* GraphQL */ `
          mutation prepareUserAvatarUpload($mediaName: String!, $userId: ID!) {
            prepareUserAvatarUpload(mediaName: $mediaName, userId: $userId) {
              _id
              putURL
              expires
            }
          }
        `,
        variables: {
          mediaName: 'test-media.jpg',
          userId: Guest._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    },
  );

  test('Access Media: returns product when media is private and is owner of media', async () => {
    const { errors, data } = await loggedInGraphqlFetch({
      query: /* GraphQL */ `
        query product($productId: ID, $slug: String) {
          product(productId: $productId, slug: $slug) {
            _id
            media {
              _id
              file {
                url
              }
            }
          }
        }
      `,
      variables: {
        productId: 'configurable-product-id',
      },
    });
    assert.strictEqual((errors || []).length, 0);
    assert.strictEqual(data?.product?.media?.length, 1);
  });

  test('DOWNLOAD Media: returns forbidden 403 for expired links', async () => {
    const { errors, data } = await loggedInGraphqlFetch({
      query: /* GraphQL */ `
        query product($productId: ID, $slug: String) {
          product(productId: $productId, slug: $slug) {
            _id
            media {
              _id
              file {
                _id
                url
              }
            }
          }
        }
      `,
      variables: {
        productId: 'configurable-product-id',
      },
    });
    assert.strictEqual((errors || []).length, 0);
    assert.strictEqual(data?.product?.media?.length, 1);

    // Set private using Drizzle - use the file._id, not the product_media._id
    const fileId = data?.product?.media?.[0]?.file?._id;
    await db.run(sql`
      UPDATE media_objects
      SET meta = json_set(COALESCE(meta, '{}'), '$.isPrivate', true, '$.userId', ${User._id})
      WHERE _id = ${fileId}
    `);

    const url = new URL(data?.product?.media?.[0]?.file?.url);
    url.searchParams.set('e', new Date().getTime().toString());
    const response = await fetch(url.toString());
    assert.strictEqual(response.status, 403);
  });
});
