import { useIntl } from 'react-intl';

import Table from '../../common/components/Table';
import SettingsListItem from './SettingsListItem';

const SettingsList = ({ namespaces }: { namespaces: string[] }) => {
  const { formatMessage } = useIntl();

  return (
    <Table className="min-w-full">
      <Table.Row header>
        <Table.Cell>
          {formatMessage({
            id: 'settings_namespace',
            defaultMessage: 'Namespace',
          })}
        </Table.Cell>
        <Table.Cell>
          <span className="sr-only">
            {formatMessage({ id: 'actions', defaultMessage: 'Actions' })}
          </span>
        </Table.Cell>
      </Table.Row>
      {namespaces.map((namespace) => (
        <SettingsListItem key={namespace} namespace={namespace} />
      ))}
    </Table>
  );
};

export default SettingsList;
