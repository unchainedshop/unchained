import React from 'react';
import { compose, pure, withHandlers, mapProps } from 'recompose';
import { Item, Segment } from 'semantic-ui-react';
import Dropzone from 'react-dropzone';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import { SortableContainer, arrayMove } from 'react-sortable-hoc';

import ProductMediaListItem from './ProductMediaListItem';

const uploadToMinio = async (file, url) => {
  const response = await fetch(url, {
    method: 'PUT',
    body: file,
  });
  if (response.ok) {
    return Promise.resolve({});
  }
  return Promise.reject(new Error('error'));
};

const ProductMediaListMinio = ({ items, onDrop, isEditingDisabled }) => (
  <Segment>
    <Item.Group divided>
      {items.map(({ _id, ...rest }, index) => (
        <ProductMediaListItem
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
    query productMedia($productId: ID) {
      product(productId: $productId) {
        _id
        status
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
      mutation prepareProductMedia($mediaName: String!, $productId: String!) {
        prepareProductMediaUpload(
          mediaName: $mediaName
          productId: $productId
        ) {
          _id
          putURL
          expires
        }
      }
    `,
    {
      name: 'prepareProductMedia',
      options: {
        refetchQueries: [],
      },
    }
  ),
  graphql(
    gql`
      mutation addProductMediaLink($mediaUploadTicketId: ID!, $productId: ID!) {
        addProductMediaLink(
          mediaUploadTicketId: $mediaUploadTicketId
          productID: $productId
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
      name: 'addProductMediaLink',
      options: {
        refetchQueries: ['productMedia'],
      },
    }
  ),
  graphql(
    gql`
      mutation reorderProductMedia($sortKeys: [ReorderProductMediaInput!]!) {
        reorderProductMedia(sortKeys: $sortKeys) {
          _id
          sortKey
        }
      }
    `,
    {
      name: 'reorderProductMedia',
      options: {
        refetchQueries: ['productMedia'],
      },
    }
  ),
  mapProps(({ data: { product }, ...rest }) => ({
    items: (product && product.media) || [],
    isEditingDisabled: !product || product.status === 'DELETED',
    pressDelay: 200,
    ...rest,
  })),
  withHandlers({
    onSortEnd:
      ({ items, reorderProductMedia }) =>
      async ({ oldIndex, newIndex }) => {
        const sortKeys = arrayMove(items, oldIndex, newIndex).map(
          (item, sortKey) => ({
            productMediaId: item._id,
            sortKey,
          })
        );
        await reorderProductMedia({
          variables: {
            sortKeys,
          },
        });
      },
    onDrop:
      ({ productId, prepareProductMedia, addProductMediaLink }) =>
      async (files) => {
        const file = files[0];
        const {
          data: { prepareProductMediaUpload },
        } = await prepareProductMedia({
          variables: {
            mediaName: file.name,
            productId,
          },
        });
        console.log(prepareProductMediaUpload);
        const { putURL, _id } = prepareProductMediaUpload;
        await uploadToMinio(file, putURL);

        await addProductMediaLink({
          variables: {
            mediaUploadTicketId: _id,
            productId,
          },
        });
      },
  }),
  pure,
  SortableContainer
)(ProductMediaListMinio);
