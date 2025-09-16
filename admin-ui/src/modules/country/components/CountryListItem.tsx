import Link from 'next/link';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';

import Badge from '../../common/components/Badge';
import Table from '../../common/components/Table';
import TableActionsMenu from '../../common/components/TableActionsMenu';

import {
  normalizeCountryISOCode,
  normalizeCurrencyISOCode,
} from '../../common/utils/utils';

const CountryListItem = ({ country, onRemove, enableEdit, enableDelete }) => {
  const { locale, formatMessage } = useIntl();
  const router = useRouter();
  const STATUS = {
    true: formatMessage({ id: 'active', defaultMessage: 'Active' }),
    false: formatMessage({ id: 'in_active', defaultMessage: 'In-Active' }),
  };
  const currencyISOcode =
    country.defaultCurrency && country.defaultCurrency.isoCode;

  const handleEdit = () => {
    router.push(`/country?countryId=${country._id}`);
  };

  const handleDelete = async () => {
    await onRemove(country._id);
  };
  return (
    <Table.Row className="text-sm">
      <Table.Cell className="whitespace-nowrap">
        <div>
          {country.isoCode}

          {country.isBase && (
            <Badge
              text={formatMessage({
                id: 'base_country',
                defaultMessage: 'Base',
              })}
              className="ml-2 "
              color="sky"
              square
            />
          )}
        </div>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        {normalizeCountryISOCode(locale, country?.isoCode, false)}
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        {currencyISOcode
          ? normalizeCurrencyISOCode(locale, currencyISOcode)
          : null}
      </Table.Cell>
      <Table.Cell className="whitespace-nowrap">
        <Badge
          text={STATUS[country.isActive]}
          color={country.isActive ? 'emerald' : 'amber'}
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

export default CountryListItem;
