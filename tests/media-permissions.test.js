import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  putFile,
  createAnonymousGraphqlFetch,
} from './helpers.js';
import {
  Admin,
  ADMIN_TOKEN,
  User,
  UnverifiedUser,
  USER_TOKEN,
  GUEST_TOKEN,
  Guest,
} from './seeds/users.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

let adminGraphqlFetch;
let loggedInGraphqlFetch;
let anonymousGraphqlFetch;
let guestGraphqlFetch;

const userAvatarFile1 = fs.createReadStream(path.resolve(dirname, `./assets/zurich.jpg`));
const userAvatar2 = fs.createReadStream(path.resolve(dirname, `./assets/contract.pdf`));

describe('Media Permissions', () => {
  beforeAll(async () => {
    await setupDatabase();
    adminGraphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
    loggedInGraphqlFetch = await createLoggedInGraphqlFetch(USER_TOKEN);
    anonymousGraphqlFetch = await createAnonymousGraphqlFetch();
    guestGraphqlFetch = await createLoggedInGraphqlFetch(GUEST_TOKEN);
  });

  describe('Mutation.prepareUserAvatarUpload for admin user should', () => {
    it('return a sign PUT url for avatar upload', async () => {
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
          mediaName: 'test-media',
          userId: Admin._id,
        },
      });

      expect(prepareUserAvatarUpload.putURL).not.toBe(null);
    }, 10000);

    it('link uploaded avatar file with user successfully', async () => {
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
            mediaName: 'test-media',
            userId: Admin._id,
          },
        },
        10000,
      );

      await putFile(userAvatarFile1, {
        url: prepareUserAvatarUpload.putURL,
        type: 'image/jpg',
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
          type: 'image/jpg',
        },
      });
      expect(confirmMediaUpload).toMatchObject({
        _id: prepareUserAvatarUpload._id,
        name: 'test-media',
        type: 'image/jpg',
        size: 38489,
      });
    });
  });

  describe('Mutation.prepareUserAvatarUpload for VERIFIED USER user should', () => {
    it('return a sign PUT url for avatar upload', async () => {
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
          mediaName: 'test-media',
          userId: User._id,
        },
      });
      expect(prepareUserAvatarUpload.putURL).not.toBe(null);
    }, 10000);

    it('link uploaded avatar file with user successfully', async () => {
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
            mediaName: 'test-media',
            userId: User._id,
          },
        },
        10000,
      );

      await putFile(userAvatar2, {
        url: prepareUserAvatarUpload.putURL,
        type: 'image/jpg',
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
          type: 'image/jpg',
        },
      });
      expect(confirmMediaUpload).toMatchObject({
        _id: prepareUserAvatarUpload._id,
        name: 'test-media',
        size: 8615,
        type: 'image/jpg',
      });
    });
  });

  describe('Mutation.prepareUserAvatarUpload for Logged in UNVERIFIED user should', () => {
    it('return NoPermissionError error', async () => {
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
          mediaName: 'test-media',
          userId: UnverifiedUser._id,
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    }, 10000);
  });
  describe('Mutation.prepareUserAvatarUpload for ANONYMOUS in user should', () => {
    it('return NoPermissionError error', async () => {
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
          mediaName: 'test-media',
          userId: Guest._id,
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    }, 10000);
  });
  describe('Mutation.prepareUserAvatarUpload for GUEST in user should', () => {
    it('return NoPermissionError error', async () => {
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
          mediaName: 'test-media',
          userId: Guest._id,
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    }, 10000);
  });
});
