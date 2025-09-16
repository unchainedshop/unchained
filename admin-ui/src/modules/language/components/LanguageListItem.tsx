import Link from 'next/link';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import Badge from '../../common/components/Badge';
import Table from '../../common/components/Table';
import TableActionsMenu from '../../common/components/TableActionsMenu';
import { normalizeLanguageISOCode } from '../../common/utils/utils';

const LanguageListItem = ({ language, onRemove, enableEdit, enableDelete }) => {
  const { locale, formatMessage } = useIntl();
  const router = useRouter();
  const STATUS = {
    true: formatMessage({ id: 'active', defaultMessage: 'Active' }),
    false: formatMessage({ id: 'in_active', defaultMessage: 'In-Active' }),
  };

  const handleEdit = () => {
    router.push(`/language?languageId=${language?._id}`);
  };

  const handleDelete = async () => {
    await onRemove(language?._id);
  };
  return (
    <Table.Row className="text-sm">
      <Table.Cell>
        <div>
          {language.isoCode}
          {language.isBase && (
            <Badge
              text={formatMessage({
                id: 'base_language',
                defaultMessage: 'Base',
              })}
              className="ml-2 text-sm"
              color="sky"
              square
            />
          )}
        </div>
      </Table.Cell>

      <Table.Cell>
        {normalizeLanguageISOCode(locale, language?.isoCode, false)}
      </Table.Cell>

      <Table.Cell>
        <Badge
          text={STATUS[language.isActive]}
          color={language.isActive ? 'emerald' : 'amber'}
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

export default LanguageListItem;
