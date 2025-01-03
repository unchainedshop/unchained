import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  putFile,
} from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { PngAssortmentMedia, SimpleAssortment } from './seeds/assortments.js';
import fs from 'node:fs';
import crypto from 'crypto';
import path from 'node:path';

import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

let graphqlFetch;

const assortmentMediaFile2 = fs.createReadStream(path.resolve(dirname, `./assets/zurich.jpg`));

const assortmentMediaFile3 = fs.createReadStream(path.resolve(dirname, `./assets/contract.pdf`));

describe('AssortmentMedia', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('Mutation.prepareAssortmentMediaUpload for admin user should', () => {
    it('return a sign PUT url for media upload', async () => {
      const {
        data: { prepareAssortmentMediaUpload },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation prepareAssortmentMediaUpload($mediaName: String!, $assortmentId: ID!) {
            prepareAssortmentMediaUpload(mediaName: $mediaName, assortmentId: $assortmentId) {
              _id
              putURL
              expires
            }
          }
        `,
        variables: {
          mediaName: 'test-media',
          assortmentId: SimpleAssortment[0]._id,
        },
      });
      expect(prepareAssortmentMediaUpload.putURL).not.toBe(null);
    }, 20000);

    it('upload file via PUT successfully', async () => {
      const {
        data: { prepareAssortmentMediaUpload },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation prepareAssortmentMediaUpload($mediaName: String!, $assortmentId: ID!) {
            prepareAssortmentMediaUpload(mediaName: $mediaName, assortmentId: $assortmentId) {
              _id
              putURL
              expires
            }
          }
        `,
        variables: {
          mediaName: 'test-media',
          assortmentId: SimpleAssortment[0]._id,
        },
      });

      expect(prepareAssortmentMediaUpload.putURL).not.toBe(null);
      await putFile(assortmentMediaFile2, {
        url: prepareAssortmentMediaUpload.putURL,
      });

      const {
        data: { assortment },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query assortment($assortmentId: ID!) {
            assortment(assortmentId: $assortmentId) {
              _id
              media {
                file {
                  name
                  url
                }
              }
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
        },
      });
      expect(assortment.media[1].file.name).toBe('test-media');
      const hash = crypto.createHash('sha256');
      const download = await (await fetch(assortment.media[1].file.url)).text();
      hash.update(download);
      expect(hash.digest('hex')).toBe(
        '5d3291cf26f878a23363c581ab4c124f65022d86089d3b532326b5705689743c',
      );
    }, 20000);

    it('link uploaded media file with assortment media successfully', async () => {
      const {
        data: { prepareAssortmentMediaUpload },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation prepareAssortmentMediaUpload($mediaName: String!, $assortmentId: ID!) {
            prepareAssortmentMediaUpload(mediaName: $mediaName, assortmentId: $assortmentId) {
              _id
              putURL
              expires
            }
          }
        `,
        variables: {
          mediaName: 'test-media',
          assortmentId: SimpleAssortment[0]._id,
        },
      });

      await putFile(assortmentMediaFile3, {
        url: prepareAssortmentMediaUpload.putURL,
        type: 'image/jpeg',
      });

      const {
        data: { confirmMediaUpload },
      } = await graphqlFetch({
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
          mediaUploadTicketId: prepareAssortmentMediaUpload._id,
          size: 8615,
          type: 'image/jpeg',
        },
      });

      expect(confirmMediaUpload).toMatchObject({
        _id: prepareAssortmentMediaUpload._id,
        name: 'test-media',
        type: 'image/jpeg',
        size: 8615,
      });
    }, 20000);
  });

  describe('mutation.reorderAssortmentMedia for admin user should', () => {
    it('update assortment media sortkey successfuly when provided valid media ID', async () => {
      const { data: { reorderAssortmentMedia } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation ReorderAssortmentmedia($sortKeys: [ReorderAssortmentMediaInput!]!) {
            reorderAssortmentMedia(sortKeys: $sortKeys) {
              _id
              tags
              file {
                _id
              }
              sortKey
              texts {
                _id
              }
            }
          }
        `,
        variables: {
          sortKeys: [
            {
              assortmentMediaId: PngAssortmentMedia._id,
              sortKey: 10,
            },
          ],
        },
      });

      expect(reorderAssortmentMedia[0].sortKey).toEqual(11);
    });

    it('skiped any passed sort key passed with in-valid media ID', async () => {
      const {
        data: { reorderAssortmentMedia },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation ReorderAssortmentmedia($sortKeys: [ReorderAssortmentMediaInput!]!) {
            reorderAssortmentMedia(sortKeys: $sortKeys) {
              _id
              tags
              file {
                _id
              }
              sortKey
              texts {
                _id
              }
            }
          }
        `,
        variables: {
          sortKeys: [
            {
              assortmentMediaId: 'invalid-media-id',
              sortKey: 10,
            },
          ],
        },
      });
      expect(reorderAssortmentMedia.length).toEqual(0);
    });
  });

  describe('mutation.reorderAssortmentMedia for anonymous user should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();

      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation ReorderAssortmentmedia($sortKeys: [ReorderAssortmentMediaInput!]!) {
            reorderAssortmentMedia(sortKeys: $sortKeys) {
              _id
            }
          }
        `,
        variables: {
          sortKeys: [
            {
              assortmentMediaId: PngAssortmentMedia._id,
              sortKey: 10,
            },
          ],
        },
      });

      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('mutation.updateAssortmentMediaTexts for admin user should', () => {
    it('update assortment media text successfuly when provided valid media ID', async () => {
      const { data: { updateAssortmentMediaTexts } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateassortmentMediaTexts(
            $assortmentMediaId: ID!
            $texts: [AssortmentMediaTextInput!]!
          ) {
            updateAssortmentMediaTexts(assortmentMediaId: $assortmentMediaId, texts: $texts) {
              _id
              locale
              title
              subtitle
            }
          }
        `,
        variables: {
          assortmentMediaId: PngAssortmentMedia._id,
          texts: {
            locale: 'en',
            title: 'english title',
            subtitle: 'english title subtitle',
          },
        },
      });

      expect(updateAssortmentMediaTexts[0]._id).not.toBe(null);
      expect(updateAssortmentMediaTexts[0]).toMatchObject({
        locale: 'en',
        title: 'english title',
        subtitle: 'english title subtitle',
      });
    });

    it('return not found error when passed non existing media ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateassortmentMediaTexts(
            $assortmentMediaId: ID!
            $texts: [AssortmentMediaTextInput!]!
          ) {
            updateAssortmentMediaTexts(assortmentMediaId: $assortmentMediaId, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          assortmentMediaId: 'invalid-media-id',
          texts: {
            locale: 'en',
            title: 'english title',
            subtitle: 'english title subtitle',
          },
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('AssortmentMediaNotFoundError');
    });

    it('return error when passed invalid media ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateassortmentMediaTexts(
            $assortmentMediaId: ID!
            $texts: [AssortmentMediaTextInput!]!
          ) {
            updateAssortmentMediaTexts(assortmentMediaId: $assortmentMediaId, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          assortmentMediaId: '',
          texts: {
            locale: 'en',
            title: 'english title',
            subtitle: 'english title subtitle',
          },
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.updateAssortmentMediaTexts for anonymous user should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();

      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateassortmentMediaTexts(
            $assortmentMediaId: ID!
            $texts: [AssortmentMediaTextInput!]!
          ) {
            updateAssortmentMediaTexts(assortmentMediaId: $assortmentMediaId, texts: $texts) {
              _id
              locale
              title
              subtitle
            }
          }
        `,
        variables: {
          assortmentMediaId: PngAssortmentMedia._id,
          texts: {
            locale: 'en',
            title: 'english title',
            subtitle: 'english title subtitle',
          },
        },
      });

      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('mutation.removeAssortmentMedia for admin user should', () => {
    it('remove assortment media successfuly when provided valid media ID', async () => {
      // eslint-disable-next-line no-unused-vars

      await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentMedia($assortmentMediaId: ID!) {
            removeAssortmentMedia(assortmentMediaId: $assortmentMediaId) {
              _id
              tags
              file {
                _id
                name
                type
                size
                url
              }
              sortKey
              texts {
                _id
                locale
                title
                subtitle
              }
            }
          }
        `,
        variables: {
          assortmentMediaId: PngAssortmentMedia._id,
        },
      });

      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentMedia($assortmentMediaId: ID!) {
            removeAssortmentMedia(assortmentMediaId: $assortmentMediaId) {
              _id
            }
          }
        `,
        variables: {
          assortmentMediaId: PngAssortmentMedia._id,
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('AssortmentMediaNotFoundError');
    }, 99999);

    it('return not found error when passed non existing assortmentMediaId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentMedia($assortmentMediaId: ID!) {
            removeAssortmentMedia(assortmentMediaId: $assortmentMediaId) {
              _id
            }
          }
        `,
        variables: {
          assortmentMediaId: 'non-existing-id',
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('AssortmentMediaNotFoundError');
    });

    it('return error when passed invalid assortmentMediaId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentMedia($assortmentMediaId: ID!) {
            removeAssortmentMedia(assortmentMediaId: $assortmentMediaId) {
              _id
            }
          }
        `,
        variables: {
          assortmentMediaId: '',
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.removeAssortmentMedia for anonymous user should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();

      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentMedia($assortmentMediaId: ID!) {
            removeAssortmentMedia(assortmentMediaId: $assortmentMediaId) {
              _id
            }
          }
        `,
        variables: {
          assortmentMediaId: PngAssortmentMedia._id,
        },
      });

      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });
});
