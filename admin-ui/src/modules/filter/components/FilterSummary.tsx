import { useIntl } from 'react-intl';

const FilterSummary = ({ filterKey, filterType }) => {
  const { formatMessage } = useIntl();
  return (
    <div className="mt-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="text-sm">
          {formatMessage({ id: 'key', defaultMessage: 'Key' })}
        </div>
        <div className="rounded-md border-1 border-slate-200 dark:border-slate-600 bg-surface-raised py-1 px-2 text-sm text-text-secondary">
          {filterKey}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm">
          {formatMessage({
            id: 'filter_type',
            defaultMessage: 'Filter Type',
          })}
        </div>
        <div className="rounded-md border-1 border-slate-200 dark:border-slate-600 bg-surface-raised py-1 px-2 text-sm text-text-secondary">
          {filterType}
        </div>
      </div>
    </div>
  );
};

export default FilterSummary;
