import React from 'react';
import { compose, pure, withHandlers, mapProps } from 'recompose';
import { Item, Segment } from 'semantic-ui-react';
import Dropzone from 'react-dropzone';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import { SortableContainer, arrayMove } from 'react-sortable-hoc';
import AssortmentMediaListItem from './AssortmentMediaListItem';
import uploadToMinio from '../../lib/uploadToMinio';

const AssortmentMediaListMinio = ({ items, onDrop, isEditingDisabled }) => (
  <Segment>
    <Item.Group divided>
      {items.map(({ _id, ...rest }, index) => (
        <AssortmentMediaListItem
          key={_id}
          index={index}
          _id={_id}
          isEditingDisabled={isEditingDisabled}
          {...rest}
        />
      ))}
      {!isEditingDisabled && (
        <Dropzone onDrop={onDrop}>
          {({ getRootProps, getInputProps }) => {
            const inputProps = getInputProps();
            return (
              <Item {...getRootProps()}>
                <Item.Content>
                  <Item.Header>Upload media</Item.Header>
                  <Item.Description>
                    <input {...inputProps} />
                    Drop files here or click to upload...
                  </Item.Description>
                </Item.Content>
              </Item>
            );
          }}
        </Dropzone>
      )}
    </Item.Group>
  </Segment>
);

export default compose(
  graphql(gql`
    query assortmentMedia($assortmentId: ID) {
      assortment(assortmentId: $assortmentId) {
        _id
        media {
          _id
          tags
          texts {
            _id
            title
            subtitle
          }
          file {
            url
            name
            size
            type
          }
        }
      }
    }
  `),
  graphql(
    gql`
      mutation addAssortmentMedia($media: Upload!, $assortmentId: ID!) {
        addAssortmentMedia(media: $media, assortmentId: $assortmentId) {
          _id
          tags
        }
      }
    `,
    {
      name: 'addAssortmentMedia',
      options: {
        refetchQueries: ['assortmentMedia'],
      },
    }
  ),
  graphql(
    gql`
      mutation prepareAssortmentMedia($mediaName: String!) {
        prepareAssortmentMediaUpload(mediaName: $mediaName) {
          _id
          putURL
          expires
        }
      }
    `,
    {
      name: 'prepareAssortmentMedia',
      options: {
        refetchQueries: [],
      },
    }
  ),
  graphql(
    gql`
      mutation addAssortmentMediaLink(
        $mediaUploadTicketId: ID!
        $assortmentId: ID!
      ) {
        addAssortmentMediaLink(
          mediaUploadTicketId: $mediaUploadTicketId
          assortmentId: $assortmentId
        ) {
          _id
          tags
          file {
            _id
            name
            type
            size
            url
          }
        }
      }
    `,
    {
      name: 'addAssortmentMediaLink',
      options: {
        refetchQueries: ['assortmentMedia'],
      },
    }
  ),

  graphql(
    gql`
      mutation reorderAssortmentMedia(
        $sortKeys: [ReorderAssortmentMediaInput!]!
      ) {
        reorderAssortmentMedia(sortKeys: $sortKeys) {
          _id
          sortKey
        }
      }
    `,
    {
      name: 'reorderAssortmentMedia',
      options: {
        refetchQueries: ['assortmentMedia'],
      },
    }
  ),
  mapProps(({ data: { assortment }, ...rest }) => ({
    items: (assortment && assortment.media) || [],
    isEditingDisabled: !assortment || assortment.status === 'DELETED',
    pressDelay: 200,
    ...rest,
  })),
  withHandlers({
    onSortEnd:
      ({ items, reorderAssortmentMedia }) =>
      async ({ oldIndex, newIndex }) => {
        const sortKeys = arrayMove(items, oldIndex, newIndex).map(
          (item, sortKey) => ({
            assortmentMediaId: item._id,
            sortKey,
          })
        );
        await reorderAssortmentMedia({
          variables: {
            sortKeys,
          },
        });
      },
    onDrop:
      ({ assortmentId, prepareAssortmentMedia, addAssortmentMediaLink }) =>
      async (files) => {
        const file = files[0];
        const {
          data: { prepareAssortmentMediaUpload },
        } = await prepareAssortmentMedia({
          variables: {
            mediaName: file.name,
          },
        });
        const { putURL, _id } = prepareAssortmentMediaUpload;
        await uploadToMinio(file, putURL);

        await addAssortmentMediaLink({
          variables: {
            mediaUploadTicketId: _id,
            assortmentId,
          },
        });
      },
  }),
  pure,
  SortableContainer
)(AssortmentMediaListMinio);
