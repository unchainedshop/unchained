import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

import MultipleSelect from '../../common/components/MultipleSelect';
import StatusFilter from '../../common/components/StatusFilter';
import { extractQuery } from '../../common/utils/normalizeFilterKeys';
import { normalizeQuery } from '../../common/utils/utils';
import DateRangeFilterInput from '../../common/components/DateRangeFilterInput';

const WORK_STATUSES = ['NEW', 'ALLOCATED', 'SUCCESS', 'FAILED', 'DELETED'];

const WorkFilter = ({ workTypes = [] }) => {
  const router = useRouter();
  const { formatMessage } = useIntl();
  const appliedStatuses = extractQuery(router.query.status);
  const appliedTypes = extractQuery(router.query.types);

  const typeChangeHandler = (selectedTypes) => {
    const { types, ...rest } = router.query;
    if (selectedTypes?.length) {
      router.push({
        query: normalizeQuery(rest, selectedTypes?.join(','), 'types'),
      });
    } else {
      router.push({
        query: normalizeQuery(rest),
      });
    }
  };

  const onStatusChange = (currentStatuses) => {
    const { status, ...rest } = router.query;
    if (currentStatuses?.length)
      router.push({
        query: normalizeQuery(rest, currentStatuses, 'status'),
      });
    else
      router.push({
        query: rest,
      });
  };

  return (
    <>
      <div className="mt-5 text-md text-slate-600 dark:text-slate-200">
        {formatMessage({
          id: 'filter_by_creation_date',
          defaultMessage: 'Filter by creation date',
        })}
      </div>
      <div className="mt-3">
        <DateRangeFilterInput />
      </div>

      <div className="mt-5">
        <MultipleSelect
          label={formatMessage({
            id: 'select_type',
            defaultMessage: 'Select type',
          })}
          tagList={appliedTypes}
          onChange={typeChangeHandler}
          options={workTypes.map((type) => ({
            label: type,
            value: type,
          }))}
        />
      </div>

      <div className="mt-5">
        <div className="text-md text-slate-800 dark:text-slate-200">
          {formatMessage({ id: 'status', defaultMessage: 'Status' })}
        </div>
        <div className="flex flex-wrap gap-5">
          <StatusFilter
            onStatusChange={onStatusChange}
            selectedStatuses={appliedStatuses}
            statuses={WORK_STATUSES}
          />
        </div>
      </div>
    </>
  );
};

export default WorkFilter;
