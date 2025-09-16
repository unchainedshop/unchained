import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

const ProvidersFilter = ({ providerType, onProviderFilterChange = null }) => {
  const { formatMessage } = useIntl();

  const router = useRouter();
  const setType = (e) => {
    const type = e.target.value;
    if (onProviderFilterChange) {
      onProviderFilterChange(e.target.value);
      return;
    }

    const { type: filterType, ...query } = router.query;
    if (type)
      router.push({
        query: {
          ...query,
          type,
        },
      });
    else
      router.push({
        query: {
          ...query,
        },
      });
  };
  return (
    <div className="w-100">
      <div className="relative my-2 flex items-start">
        <select
          onChange={setType}
          defaultValue={null}
          id="select-type"
          name="select-type"
          autoComplete="off"
          className="dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 w-50 block w-full rounded-md border-slate-300 shadow-xs  focus:ring-slate-800 sm:text-sm"
        >
          <option value="">
            {formatMessage({
              id: 'filter_by_type',
              defaultMessage: 'Filter by type',
            })}
          </option>
          {providerType.map((type) => (
            <option key={type} value={type}>
              {formatMessage({
                id: type,
                defaultMessage: type,
                description: 'Delivery provider type',
              })}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ProvidersFilter;
