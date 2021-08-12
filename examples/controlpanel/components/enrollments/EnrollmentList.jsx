import gql from 'graphql-tag';
import React from 'react';
import { Table } from 'semantic-ui-react';
import Link from 'next/link';
import { compose, defaultProps } from 'recompose';
import InfiniteDataTable, { withDataTableLoader } from '../InfiniteDataTable';

const EnrollmentList = ({
  isShowCarts,
  toggleShowCarts,
  loading,
  updateHasMore,
  setShowCarts,
  ...rest
}) => (
  <InfiniteDataTable
    {...rest}
    cols={5}
    createPath={null}
    rowRenderer={(enrollment) => (
      <Table.Row key={enrollment._id}>
        <Table.Cell>
          <Link href={`/enrollments/view?_id=${enrollment._id}`}>
            <a href={`/enrollments/view?_id=${enrollment._id}`}>
              {enrollment.enrollmentNumber ? (
                <>
                  <b>{enrollment.enrollmentNumber}</b>
                  <small>
                    &nbsp;(
                    {enrollment._id})
                  </small>
                </>
              ) : (
                <>
                  <b>Enrollment</b>
                  <small>
                    &nbsp;(
                    {enrollment._id})
                  </small>
                </>
              )}
            </a>
          </Link>
        </Table.Cell>
        <Table.Cell>
          {enrollment.user && (enrollment.user.name || enrollment.user._id)}
        </Table.Cell>
        <Table.Cell>
          {enrollment.expires &&
            new Date(enrollment.expires).toLocaleDateString()}
        </Table.Cell>
        <Table.Cell>{enrollment.status}</Table.Cell>
      </Table.Row>
    )}
  >
    <Table.Row>
      <Table.HeaderCell>Enrollment #</Table.HeaderCell>
      <Table.HeaderCell>User</Table.HeaderCell>
      <Table.HeaderCell>Expires</Table.HeaderCell>
      <Table.HeaderCell>Status</Table.HeaderCell>
    </Table.Row>
  </InfiniteDataTable>
);

export default compose(
  defaultProps({ limit: 20, offset: 0 }),
  withDataTableLoader({
    queryName: 'enrollments',
    query: gql`
      query enrollments($offset: Int, $limit: Int) {
        enrollments(offset: $offset, limit: $limit) {
          _id
          status
          expires
          enrollmentNumber
          user {
            _id
            name
          }
          status
        }
      }
    `,
  })
)(EnrollmentList);
