import { useIntl } from 'react-intl';
import Table from '../../common/components/Table';
import EnrollmentListItem from './EnrollmentListItem';

const EnrollmentList = ({ enrollments, showUser = null, sortable = false }) => {
  const { formatMessage } = useIntl();

  return (
    <Table className="min-w-full">
      {enrollments?.map((enrollment) => (
        <Table.Row key={enrollment._id} header enablesort={sortable}>
          <Table.Cell sortKey="enrollmentNumber">
            {formatMessage({
              id: 'enrollment_number',
              defaultMessage: 'Enrollment number',
            })}
          </Table.Cell>

          <Table.Cell sortKey="created">
            {formatMessage({
              id: 'created',
              defaultMessage: 'Created',
            })}
          </Table.Cell>

          <Table.Cell>
            {formatMessage({
              id: 'expires',
              defaultMessage: 'Expires',
            })}
          </Table.Cell>
          {showUser && (
            <Table.Cell>
              {formatMessage({
                id: 'user',
                defaultMessage: 'User',
              })}
            </Table.Cell>
          )}

          <Table.Cell>
            {formatMessage({
              id: 'product',
              defaultMessage: 'Product',
            })}
          </Table.Cell>

          <Table.Cell sortKey="status">
            {formatMessage({
              id: 'status',
              defaultMessage: 'Status',
            })}
          </Table.Cell>
        </Table.Row>
      ))}
      {enrollments?.map((enrollment) => (
        <EnrollmentListItem
          showUser
          key={`${enrollment?._id}-body`}
          enrollment={enrollment}
        />
      ))}
    </Table>
  );
};

export default EnrollmentList;
