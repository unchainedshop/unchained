import { useRouter } from 'next/router';
import Table from '../../common/components/Table';

const SettingsListItem = ({ namespace }: { namespace: string }) => {
  const { push, query } = useRouter();

  const handleClick = () => {
    push({ query: { ...query, namespace } });
  };

  return (
    <Table.Row
      className="cursor-pointer text-sm hover:bg-surface-raised"
      onClick={handleClick}
    >
      <Table.Cell>
        <span className="font-medium text-text-primary">{namespace}</span>
      </Table.Cell>
    </Table.Row>
  );
};

export default SettingsListItem;
