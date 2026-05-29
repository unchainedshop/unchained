import { useIntl } from 'react-intl';

const ListHeader = ({ children = null, totalRecords = null }) => {
  const { formatMessage } = useIntl();
  return (
    <div className="mt-5">
      {totalRecords !== null ? (
        <div className="text-md text-slate-950 dark:text-slate-100 mb-3">
          {formatMessage(
            { id: 'total_records', defaultMessage: '{total} records found' },
            {
              total: totalRecords ?? 0,
            },
          )}
        </div>
      ) : null}
      {children && (
        <div className="flex items-center mt-10">
          <h3 className="text-xs leading-6 text-slate-500 dark:text-slate-200">
            {children}
          </h3>
        </div>
      )}
    </div>
  );
};

export default ListHeader;
