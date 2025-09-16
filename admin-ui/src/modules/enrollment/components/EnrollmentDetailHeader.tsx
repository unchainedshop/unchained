import { useIntl } from 'react-intl';

import useFormatDateTime from '../../common/utils/useFormatDateTime';
import Badge from '../../common/components/Badge';
import DetailHeader from '../../common/components/DetailHeader';
import { normalizeCurrencyISOCode } from '../../common/utils/utils';

const EnrollmentDetailHeader = ({ enrollment }) => {
  const { formatMessage, locale } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  return (
    <section>
      <DetailHeader user={enrollment?.user} contact={enrollment?.contact} />
      <div className="mt-2 flex border-b border-slate-300 dark:border-slate-800 pb-2 text-sm">
        <dl className="flex flex-wrap items-center gap-1">
          <dt className="hidden capitalize text-slate-500 sm:block">
            {formatMessage({
              id: 'enrollment',
              defaultMessage: 'enrollment',
            })}
            &#35; &nbsp;
          </dt>
          <dd className="inline-flex text-lg font-medium text-slate-900 sm:flex-none sm:text-xl sm:font-semibold">
            <span className="sm:hidden">&#35;&nbsp;</span>
            {enrollment?.enrollmentNumber ? (
              <Badge
                color="slate"
                text={enrollment?.enrollmentNumber}
                className="p-0 text-lg font-medium sm:text-xl sm:font-semibold"
              />
            ) : (
              <Badge
                text={formatMessage({
                  id: 'initial',
                  defaultMessage: 'Initial',
                })}
                color="yellow"
                className="p-0 text-lg font-medium sm:text-xl sm:font-semibold"
              />
            )}
          </dd>
          <dt>
            <span className="sr-only">
              {formatMessage({ id: 'date', defaultMessage: 'Date' })}
            </span>
          </dt>
          <dd className="font-medium text-slate-900">
            {enrollment?.ordered ? formatDateTime(enrollment?.ordered) : null}
          </dd>
        </dl>
        <div className="ml-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-slate-900 sm:text-base">
          <span>{enrollment?.country?.flagEmoji}</span>
          <span>
            {normalizeCurrencyISOCode(locale, enrollment?.currency?.isoCode)}
          </span>
          <span>
            {enrollment?.currency?.isoCode && (
              <Badge
                text={enrollment?.currency?.isoCode}
                color="amber"
                className="px-2 py-0 sm:py-1"
                square
              />
            )}
          </span>
        </div>
      </div>
    </section>
  );
};

export default EnrollmentDetailHeader;
