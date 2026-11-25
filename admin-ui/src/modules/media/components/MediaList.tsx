import { useIntl } from 'react-intl';
import Table from '../../common/components/Table';
import MediaListItem from './MediaListItem';

const MediaList = ({ medias, sortable }) => {
  const { formatMessage } = useIntl();
  return (
    <Table className="min-w-full">
      {medias?.map((media) => (
        <Table.Row key={media._id} header enablesort={sortable}>
          <Table.Cell sortKey="name">
            {formatMessage({ id: 'name', defaultMessage: 'Name' })}
          </Table.Cell>
          <Table.Cell sortKey="type">
            {formatMessage({ id: 'type', defaultMessage: 'Type' })}
          </Table.Cell>
          <Table.Cell sortKey="size">
            {formatMessage({ id: 'size', defaultMessage: 'Size' })}
          </Table.Cell>
        </Table.Row>
      ))}

      {medias?.map((media) => (
        <MediaListItem key={media._id} media={media} />
      ))}
    </Table>
  );
};

export default MediaList;
