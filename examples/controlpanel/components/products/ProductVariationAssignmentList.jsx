import React from 'react';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import { Segment, Table, Button } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import SearchDropdown from '../SearchDropdown';
import { SEARCH_PRODUCTS } from '../searchQueries';

const ProductVariationAssignmentList = ({
  columnTitles,
  addProductAssignment,
  removeProductAssignment,
  rows,
}) => (
  <Segment>
    <Table celled>
      <Table.Header>
        <Table.Row>
          {columnTitles.map((title) => (
            <Table.HeaderCell key={title}>{title}</Table.HeaderCell>
          ))}
          <Table.HeaderCell>Product</Table.HeaderCell>
          <Table.HeaderCell>Options</Table.HeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {rows.map(({ _id, columns, product }) => (
          <Table.Row key={_id}>
            {columns.map((column) => (
              <Table.Cell key={`${column}`}>{column}</Table.Cell>
            ))}
            <Table.Cell>
              {product ? (
                <div>{product.texts.title}</div>
              ) : (
                <SearchDropdown
                  placeholder="Select Product"
                  searchQuery={SEARCH_PRODUCTS}
                  onChange={addProductAssignment(columns)}
                  queryType={'products'}
                  value={product ? product._id : ''}
                  options={columns}
                />
              )}
            </Table.Cell>
            <Table.Cell>
              {product && product._id && (
                <Button
                  small
                  onClick={removeProductAssignment}
                  optionValues={columns}
                >
                  X
                </Button>
              )}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  </Segment>
);

const matrixGenerator = (columns, rowContainer, currentIndex) => {
  const column = columns[currentIndex];
  const newRows = [];
  column.values.forEach((value) => {
    const tempRow = {};
    tempRow[column.key] = value;
    if (rowContainer.length > 0) {
      rowContainer.forEach((oldRow) => {
        newRows.push({ ...oldRow, ...tempRow });
      });
    } else {
      newRows.push(tempRow);
    }
  });

  if (columns.length > currentIndex + 1) {
    return matrixGenerator(columns, newRows, currentIndex + 1);
  }
  return newRows;
};

export default compose(
  graphql(gql`
    query productVariationAssignments($productId: ID) {
      product(productId: $productId) {
        _id
        ... on ConfigurableProduct {
          variations {
            _id
            key
            texts {
              _id
              title
            }
            options {
              _id
              value
              texts {
                _id
                title
              }
            }
          }
          assignments(includeInactive: true) {
            _id
            vectors {
              _id
              variation {
                _id
                key
              }
              option {
                _id
                value
              }
            }
            product {
              _id
              texts {
                _id
                title
              }
            }
          }
        }
      }
    }
  `),
  graphql(
    gql`
      mutation addProductAssignment(
        $proxyId: ID!
        $productId: ID!
        $vectors: [ProductAssignmentVectorInput!]!
      ) {
        addProductAssignment(
          proxyId: $proxyId
          productId: $productId
          vectors: $vectors
        ) {
          _id
        }
      }
    `,
    {
      name: 'addProductAssignment',
      options: {
        refetchQueries: ['productVariationAssignments'],
      },
    }
  ),
  graphql(
    gql`
      mutation removeProductAssignment(
        $proxyId: ID!
        $vectors: [ProductAssignmentVectorInput!]!
      ) {
        removeProductAssignment(proxyId: $proxyId, vectors: $vectors) {
          _id
        }
      }
    `,
    {
      name: 'removeProductAssignment',
      options: {
        refetchQueries: ['productVariationAssignments'],
      },
    }
  ),
  mapProps(({ data: { product }, ...rest }) => {
    const variations = (product && product.variations) || [];
    const columnTitles = variations.map(
      ({ texts, key }) => texts?.title || key
    );
    const columnKeys = variations.map(({ key }) => key);

    const keyValueCombinations = variations.map(({ key, options }) => ({
      values: (options || []).map((option) => option.value),
      key,
    }));
    const allRowsPossible =
      keyValueCombinations.length > 0
        ? matrixGenerator(keyValueCombinations, [], 0)
        : [];

    const assignments = (product && product.assignments) || [];
    const allAssignedRows = {};
    assignments.forEach((assignment) => {
      const selector = {};
      assignment.vectors.forEach((vector) => {
        selector[vector.variation.key] = vector.option.value;
      });
      allAssignedRows[Object.values(selector).join('')] = assignment.product;
    });

    const rows = allRowsPossible.map((row) => {
      const hash = Object.values(row).join('');
      return {
        _id: hash,
        product: allAssignedRows[hash],
        columns: Object.values(row),
        columnsText: Object.values(row),
      };
    });

    return {
      columnTitles,
      columnKeys,
      rows,
      isEditingDisabled: !product || product.status === 'DELETED',
      pressDelay: 200,
      ...rest,
    };
  }),
  withHandlers({
    addProductAssignment: ({ addProductAssignment, productId, columnKeys }) => (
      optionValues
    ) => async (_, { value }) => {
      await addProductAssignment({
        variables: {
          proxyId: productId,
          productId: value,
          vectors: optionValues.map((optionValue, index) => ({
            key: columnKeys[index],
            value: optionValue,
          })),
        },
      });
    },
    removeProductAssignment: ({
      removeProductAssignment,
      productId,
      columnKeys,
    }) => async (_, { optionValues }) => {
      await removeProductAssignment({
        variables: {
          proxyId: productId,
          vectors: optionValues.map((optionValue, index) => ({
            key: columnKeys[index],
            value: optionValue,
          })),
        },
      });
    },
  }),
  pure
)(ProductVariationAssignmentList);
