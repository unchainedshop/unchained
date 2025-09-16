'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { normalizeQuery } from '../utils/utils';
import DateInputField from './DateInput';
import { useIntl } from 'react-intl';
import useFormatDateTime from '../utils/useFormatDateTime';

const DateRangeFilterInput = () => {
  const { parseDate } = useFormatDateTime();
  const { formatMessage } = useIntl();
  const router = useRouter();

  return (
    <div className="flex items-center justify-center">
      <label className="ml-1 mr-2" htmlFor="work-start">
        {formatMessage({ id: 'from', defaultMessage: 'From' })}
      </label>
      <DateInputField
        id="work-start"
        onChange={(value: any) => {
          if (value)
            router.push({
              query: normalizeQuery(
                router.query,
                new Date(value).toISOString(),
                'start',
              ),
            });
          else {
            const { start, ...rest } = router.query;
            router.push({ query: { ...rest } });
          }
        }}
        placeholder={formatMessage({
          id: 'start_date',
          defaultMessage: 'Start date',
        })}
        value={router?.query?.start ? parseDate(router?.query?.start) : null}
        containerClassName="w-full"
      />
      <label className="mr-2 ml-3 " htmlFor="report-end">
        {formatMessage({ id: 'to', defaultMessage: 'To' })}
      </label>
      <DateInputField
        id="work-end"
        onChange={(value: any) => {
          if (value)
            router.push({
              query: normalizeQuery(
                router.query,
                new Date(value).toISOString(),
                'end',
              ),
            });
          else {
            const { end, ...rest } = router.query;
            router.push({ query: { ...rest } });
          }
        }}
        placeholder={formatMessage({
          id: 'end_date',
          defaultMessage: 'End Date',
        })}
        value={
          router?.query?.end
            ? parseDate(router?.query?.end)
            : parseDate(new Date())
        }
        containerClassName="w-full"
      />
    </div>
  );
};

export default DateRangeFilterInput;
