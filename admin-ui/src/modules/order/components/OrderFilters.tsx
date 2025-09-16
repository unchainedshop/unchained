import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

import MultipleSelect from '../../common/components/MultipleSelect';
import StatusFilter from '../../common/components/StatusFilter';
import { extractQuery } from '../../common/utils/normalizeFilterKeys';
import { normalizeQuery } from '../../common/utils/utils';
import DateRangeFilterInput from '../../common/components/DateRangeFilterInput';
import { useMemo } from 'react';

const ORDER_STATUSES = ['PENDING', 'REJECTED', 'CONFIRMED', 'FULLFILLED'];

const OrderFilters = ({ paymentProviders = [], deliveryProviders = [] }) => {
  const router = useRouter();
  const { formatMessage } = useIntl();
  const appliedStatuses = extractQuery(router.query.status);
  const appliedPaymentProvidersFilter = extractQuery(
    router.query?.['payment_providers'],
  );
  const appliedDeliveryProvidersFilter = extractQuery(
    router.query?.['delivery_providers'],
  );
  const typeChangeHandler = (filterKey) => (selectedTypes) => {
    const { [filterKey]: _, ...rest } = router.query;
    if (selectedTypes?.length) {
      router.push({
        query: normalizeQuery(rest, selectedTypes.join(','), filterKey),
      });
    } else {
      router.push({ query: normalizeQuery(rest) }); // key is removed
    }
  };

  const onStatusChange = (currentStatuses) => {
    const { status, ...rest } = router.query;
    if (currentStatuses?.length) {
      router.push({
        query: normalizeQuery(rest, currentStatuses, 'status'),
      });
    } else {
      router.push({ query: rest });
    }
  };

  const normalizedAppliedPaymentProvidersFilter = useMemo(
    () =>
      appliedPaymentProvidersFilter
        .map((providerId) => {
          const provider = paymentProviders.find((p) => p.value === providerId);
          return provider?.label;
        })
        .filter(Boolean),
    [paymentProviders],
  );

  const normalizedAppliedDeliveryProvidersFilter = useMemo(
    () =>
      appliedDeliveryProvidersFilter
        .map((providerId) => {
          const provider = deliveryProviders.find(
            (p) => p.value === providerId,
          );
          return provider?.label;
        })
        .filter(Boolean),
    [deliveryProviders],
  );
  return (
    <div className="space-y-6 dark:bg-slate-900">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wide mb-3">
          {formatMessage({
            id: 'filter_by_creation_date',
            defaultMessage: 'Filter by creation date',
          })}
        </h3>
        <div className="mt-3">
          <DateRangeFilterInput />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MultipleSelect
          label={formatMessage({
            id: 'payment_providers',
            defaultMessage: 'Payment providers',
          })}
          tagList={normalizedAppliedPaymentProvidersFilter}
          onChange={typeChangeHandler('payment_providers')}
          options={paymentProviders.map(({ value, label }) => ({
            label,
            value,
          }))}
        />

        <MultipleSelect
          label={formatMessage({
            id: 'delivery_providers',
            defaultMessage: 'Delivery providers',
          })}
          tagList={normalizedAppliedDeliveryProvidersFilter}
          onChange={typeChangeHandler('delivery_providers')}
          options={deliveryProviders.map(({ value, label }) => ({
            value,
            label,
          }))}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wide mb-3">
          {formatMessage({
            id: 'order_status',
            defaultMessage: 'Order status',
          })}
        </h3>
        <div className="flex flex-wrap gap-3">
          <StatusFilter
            onStatusChange={onStatusChange}
            selectedStatuses={appliedStatuses}
            statuses={ORDER_STATUSES}
          />
        </div>
      </div>
    </div>
  );
};

export default OrderFilters;
