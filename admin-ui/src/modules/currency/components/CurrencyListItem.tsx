import Link from 'next/link';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';

import Badge from '../../common/components/Badge';
import Table from '../../common/components/Table';
import TableActionsMenu from '../../common/components/TableActionsMenu';
import { normalizeCurrencyISOCode } from '../../common/utils/utils';

const CurrencyListItem = ({ currency, onRemove, enableEdit, enableDelete }) => {
  const { locale, formatMessage } = useIntl();
  const router = useRouter();

  const STATUS = {
    true: formatMessage({ id: 'active', defaultMessage: 'Active' }),
    false: formatMessage({ id: 'in_active', defaultMessage: 'In-Active' }),
  };

  const handleEdit = () => {
    router.push(`/currency?currencyId=${currency?._id}`);
  };

  const handleDelete = () => {
    onRemove(currency?._id);
  };

  return (
    <Table.Row className="text-sm">
      <Table.Cell>{currency.isoCode}</Table.Cell>

      <Table.Cell>
        {normalizeCurrencyISOCode(locale, currency?.isoCode, false)}
      </Table.Cell>

      <Table.Cell>
        <Badge
          text={STATUS[currency.isActive]}
          color={currency.isActive ? 'emerald' : 'amber'}
          square
        />
      </Table.Cell>
      {(enableEdit || enableDelete) && (
        <Table.Cell>
          <TableActionsMenu
            onEdit={enableEdit ? handleEdit : undefined}
            onDelete={enableDelete ? handleDelete : undefined}
            showEdit={enableEdit}
            showDelete={enableDelete}
          />
        </Table.Cell>
      )}
    </Table.Row>
  );
};

export default CurrencyListItem;
