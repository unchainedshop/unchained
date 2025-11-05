import { useIntl } from 'react-intl';

import ProviderListItem from './ProvidersListItem';
import Table from './Table';

const ProvidersList = ({
  providers,
  providerPath,
  onRemove,
  canEdit,
  canDelete,
}) => {
  const { formatMessage } = useIntl();

  return (
    <Table>
      {providers?.map((provider) => (
        <Table.Row key={provider._id} header>
          <Table.Cell>
            {formatMessage({
              id: 'interface',
              defaultMessage: 'Interface',
            })}
          </Table.Cell>

          <Table.Cell>
            {formatMessage({ id: 'type', defaultMessage: 'Type' })}
          </Table.Cell>
          {canEdit || canDelete ? (
            <Table.Cell>
              <span className="sr-only">
                {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
                {formatMessage({ id: 'delete', defaultMessage: 'Delete' })}
              </span>
            </Table.Cell>
          ) : (
            <Table.Cell>&nbsp;</Table.Cell>
          )}
        </Table.Row>
      ))}
      {providers?.map((provider) => (
        <ProviderListItem
          key={`${provider?._id}-body`}
          provider={provider}
          providerPath={providerPath}
          onRemove={onRemove}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ))}
    </Table>
  );
};

export default ProvidersList;
