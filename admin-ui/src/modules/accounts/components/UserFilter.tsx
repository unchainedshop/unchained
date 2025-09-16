import React from 'react';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import DateInputField from '../../common/components/DateInput';

const UserFilter: React.FC = () => {
  const { parseDate } = useFormatDateTime();
  const router = useRouter();
  const { formatMessage } = useIntl();

  const updateQuery = (field: string, value: any) => {
    if (value)
      router.push({
        query: {
          ...router.query,
          [field]: value,
        },
      });
    else if (!value && router.query?.[field]) {
      const newQuery = router.query;
      delete newQuery[field];
      router.push({
        query: {
          ...newQuery,
        },
      });
    }
  };

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-10">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-500 mb-1">
            {formatMessage({
              id: 'email_verified_label',
              defaultMessage: 'E-Mail verified',
            })}
          </label>
          <select
            className="w-full p-2 border-1 border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-500 focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400 focus:outline-hidden"
            defaultValue={router.query?.emailVerified || ''}
            onChange={(e) => updateQuery('emailVerified', e.target.value)}
          >
            <option value="">
              {formatMessage({
                id: 'email_verified_default',
                defaultMessage: 'All',
              })}
            </option>
            <option value={true.toString()}>
              {formatMessage({
                id: 'email_verified_true',
                defaultMessage: 'verified',
              })}
            </option>
            <option value={false.toString()}>
              {formatMessage({
                id: 'email_verified_false',
                defaultMessage: 'unverified',
              })}
            </option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-500 mb-1">
            {formatMessage({
              id: 'login_date_range',
              defaultMessage: 'Login Date Range',
            })}
          </label>
          <div className="flex items-center flex-wrap md:flex-nowrap space-y-1 md:space-x-3">
            <label htmlFor="lastLoginStart" className="text-sm">
              {formatMessage({ id: 'from', defaultMessage: 'From' })}
            </label>
            <DateInputField
              id="lastLoginStart"
              onChange={(date: any) =>
                updateQuery('start', date ? new Date(date).toISOString() : null)
              }
              placeholder={formatMessage({
                id: 'start_date',
                defaultMessage: 'Start date',
              })}
              value={
                router.query.start
                  ? parseDate(router.query.start as string)
                  : null
              }
              containerClassName="w-full  focus:outline-hidden focus:ring-slate-800"
            />
            <label htmlFor="lastLoginEnd" className="text-sm">
              {formatMessage({ id: 'to', defaultMessage: 'To' })}
            </label>
            <DateInputField
              id="lastLoginEnd"
              onChange={(date: any) =>
                updateQuery('end', date ? new Date(date).toISOString() : null)
              }
              placeholder={formatMessage({
                id: 'end_date',
                defaultMessage: 'End Date',
              })}
              value={
                router.query.end ? parseDate(router.query.end as string) : null
              }
              containerClassName="w-full  focus:outline-hidden focus:ring-slate-800"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default UserFilter;
