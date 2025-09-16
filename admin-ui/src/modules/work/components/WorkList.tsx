import { useIntl } from 'react-intl';
import Table from '../../common/components/Table';
import WorkListItem from './WorkListItem';

const WorkList = ({ workQueue, sortable }) => {
  const { formatMessage } = useIntl();

  return (
    <Table className="min-w-full">
      {workQueue?.map((work) => (
        <Table.Row key={`${work._id}-header`} header enablesort={sortable}>
          <Table.Cell sortKey="type">
            {formatMessage({
              id: 'work_type_header',
              defaultMessage: 'Type',
            })}
          </Table.Cell>

          <Table.Cell sortKey="status">
            {formatMessage({ id: 'status', defaultMessage: 'Status' })}
          </Table.Cell>

          <Table.Cell sortKey="created">
            {formatMessage({
              id: 'created',
              defaultMessage: 'Created',
            })}
          </Table.Cell>

          <Table.Cell sortKey="scheduled" defaultSortDirection="DESC">
            {formatMessage({
              id: 'scheduled',
              defaultMessage: 'Scheduled',
            })}
          </Table.Cell>

          <Table.Cell sortKey="started">
            {formatMessage({
              id: 'started',
              defaultMessage: 'Started',
            })}
          </Table.Cell>

          <Table.Cell sortKey="finished">
            {formatMessage({
              id: 'finished',
              defaultMessage: 'Finished',
            })}
          </Table.Cell>
          <Table.Cell>
            {formatMessage({
              id: 'duration',
              defaultMessage: 'Duration',
            })}
          </Table.Cell>
        </Table.Row>
      ))}

      {workQueue?.map((work) => (
        <WorkListItem
          key={`${work?._id}-body-${JSON.stringify(work)}`}
          work={work}
        />
      ))}
    </Table>
  );
};

export default WorkList;
