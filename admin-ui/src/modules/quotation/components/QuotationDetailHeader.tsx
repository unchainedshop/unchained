import { useIntl } from 'react-intl';

import useFormatDateTime from '../../common/utils/useFormatDateTime';
import Badge from '../../common/components/Badge';
import DetailHeader from '../../common/components/DetailHeader';
import { normalizeCurrencyISOCode } from '../../common/utils/utils';

const QuotationDetailHeader = ({ quotation }) => {
  const { formatMessage, locale } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  return (
    <section>
      <DetailHeader user={quotation?.user} contact={quotation?.contact} />
      <div className="mt-2 flex border-b border-slate-300 dark:border-slate-800 pb-2 text-sm">
        <dl className="flex flex-wrap items-center gap-1">
          <dt className="hidden capitalize text-slate-500 sm:block">
            {formatMessage({
              id: 'quotation',
              defaultMessage: 'quotation',
            })}
            &#35; &nbsp;
          </dt>
          <dd className="inline-flex text-lg font-medium text-slate-900 sm:text-xl sm:font-semibold">
            <span className="sm:hidden">&#35;&nbsp;</span>
            {quotation?.quotationNumber ? (
              <Badge
                text={quotation?.quotationNumber}
                color="slate"
                square
                className="text-lg font-medium sm:text-xl sm:font-semibold"
              />
            ) : (
              <Badge
                text={formatMessage({
                  id: 'requested',
                  defaultMessage: 'Requested',
                })}
                color="yellow"
                className="text-lg font-medium sm:text-xl sm:font-semibold"
              />
            )}
          </dd>
          <dt>
            <span className="sr-only">
              {formatMessage({ id: 'date', defaultMessage: 'Date' })}
            </span>
          </dt>
          <dd className="font-medium text-slate-900">
            {quotation?.ordered &&
              formatDateTime(quotation?.ordered, {
                timeStyle: 'short',
                dateStyle: 'full',
              })}
          </dd>
        </dl>

        <div className="ml-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-slate-900 sm:text-base">
          <span>{quotation?.country?.flagEmoji}</span>
          <span>
            {normalizeCurrencyISOCode(locale, quotation?.currency?.isoCode)}
          </span>
          <span>
            {quotation?.currency?.isoCode && (
              <Badge
                text={quotation?.currency?.isoCode}
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

export default QuotationDetailHeader;
