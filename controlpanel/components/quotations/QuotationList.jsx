import { format } from 'date-fns';
import gql from 'graphql-tag';
import React from 'react';
import { Table } from 'semantic-ui-react';
import Link from 'next/link';
import InfiniteDataTable, { withDataTableLoader } from '../InfiniteDataTable';

const QuotationList = ({
  loading, updateHasMore, ...rest
}) => (
  <InfiniteDataTable
    {...rest}
    cols={5}
    createPath={null}
    rowRenderer={(quotation => (
      <Table.Row key={quotation._id}>
        <Table.Cell>
          <Link href={`/quotations/view?_id=${quotation._id}`}>
            <a href={`/quotations/view?_id=${quotation._id}`}>
              {quotation.quotationNumber ? (
                <>
                  <b>
                    {quotation.quotationNumber}
                  </b>
                  <small>
                  &nbsp;(
                    {quotation._id}
                  )
                  </small>
                </>
              ) : (
                <>
                  <b>
                    RFP
                  </b>
                  <small>
                    &nbsp;(
                    {quotation._id}
                    )
                  </small>
                </>
              )}
            </a>
          </Link>
        </Table.Cell>
        <Table.Cell>
          {quotation.product && (
            <Link href={`/products/edit?_id=${quotation.product._id}`}>
              <a href={`/products/edit?_id=${quotation.product._id}`}>
                <b>
                  {quotation.product.texts.title}
                </b>
                <small>
                &nbsp;(
                  {quotation.product.sku}
                )
                </small>
              </a>
            </Link>
          )}
        </Table.Cell>
        <Table.Cell>
          {quotation.user && (
            <Link href={`/users/edit?_id=${quotation.user._id}`}>
              <a href={`/users/edit?_id=${quotation.user._id}`}>
                {quotation.user.name || quotation.user._id}
              </a>
            </Link>
          )}
        </Table.Cell>
        <Table.Cell>
          {quotation.expires
            ? format(quotation.expires, 'Ppp')
            : 'n/a'}
        </Table.Cell>
        <Table.Cell>
          {quotation.status}
        </Table.Cell>
      </Table.Row>
    ))}
  >
    <Table.Row>
      <Table.HeaderCell>
        Quotation #
      </Table.HeaderCell>
      <Table.HeaderCell>
        Product
      </Table.HeaderCell>
      <Table.HeaderCell>
        User
      </Table.HeaderCell>
      <Table.HeaderCell>
        Expiry Date
      </Table.HeaderCell>
      <Table.HeaderCell>
        Status
      </Table.HeaderCell>
    </Table.Row>
  </InfiniteDataTable>
);

export default
withDataTableLoader({
  queryName: 'quotations',
  query: gql`
      query quotations($offset: Int, $limit: Int) {
        quotations(offset: $offset, limit: $limit) {
          _id
          expires
          quotationNumber
          status
          user {
            _id
            name
          }
          product {
            _id
            ... on SimpleProduct {
              sku
            }
            texts {
              _id
              title
            }
          }
        }
      }
    `,
})(QuotationList);
