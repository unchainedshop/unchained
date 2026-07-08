import { useState } from 'react';
import { useIntl } from 'react-intl';
import { TruckIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import DateInputField from '@/components/ui/DateInput';
import Loading from '@/components/ui/Loading';
import NoData from '@/components/ui/NoData';
import HelpText from '@/components/ui/HelpText';
import { IDeliveryProviderType } from '../../../gql/types';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import useProductFulfillmentSimulation from '../hooks/useProductFulfillmentSimulation';

const inputClassName =
  'w-full rounded-md border-1 border-border-default bg-surface-input px-3 py-2 text-sm shadow-xs text-text-primary focus:outline-hidden focus:ring-2 focus:ring-focus-ring';

const providerLabel = (provider) =>
  [provider?.interface?.label, provider?.interface?.version]
    .filter(Boolean)
    .join(' ') ||
  provider?._id ||
  null;

const FulfillmentPreview = ({ productId }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const [quantity, setQuantity] = useState(1);
  const [referenceDate, setReferenceDate] = useState<string | null>(null);
  const [deliveryProviderType, setDeliveryProviderType] = useState('');

  const { dispatches, unroutedStocks, loading, error } =
    useProductFulfillmentSimulation({
      productId,
      quantity,
      referenceDate: referenceDate ? new Date(referenceDate).getTime() : null,
      deliveryProviderType: (deliveryProviderType ||
        null) as IDeliveryProviderType,
    });

  return (
    <div className="mt-5 md:mt-0 space-y-6">
      <div>
        <HelpText
          messageKey="fulfillment_preview_description"
          defaultMessage="Preview which delivery and warehousing providers the engine would use to fulfill this product, exactly as calculated during checkout."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-2xl">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="simulation-quantity"
            className="text-sm font-medium text-text-secondary"
          >
            {formatMessage({
              id: 'quantity',
              defaultMessage: 'Quantity',
            })}
          </label>
          <input
            type="number"
            id="simulation-quantity"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className={inputClassName}
          />
        </div>
        <DateInputField
          id="simulation-reference-date"
          label={formatMessage({
            id: 'simulate_as_of',
            defaultMessage: 'Simulate as of',
          })}
          value={referenceDate}
          onChange={setReferenceDate}
        />
        <div className="flex flex-col gap-1">
          <label
            htmlFor="simulation-delivery-type"
            className="text-sm font-medium text-text-secondary"
          >
            {formatMessage({
              id: 'delivery_type',
              defaultMessage: 'Delivery type',
            })}
          </label>
          <select
            id="simulation-delivery-type"
            value={deliveryProviderType}
            onChange={(e) => setDeliveryProviderType(e.target.value)}
            className={inputClassName}
          >
            <option value="">
              {formatMessage({
                id: 'all_types',
                defaultMessage: 'All types',
              })}
            </option>
            {Object.values(IDeliveryProviderType).map((type) => (
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

      {loading ? (
        <Loading />
      ) : error && !dispatches.length && !unroutedStocks.length ? (
        <div className="text-sm text-danger">
          {formatMessage({
            id: 'fulfillment_simulation_error',
            defaultMessage: 'Fulfillment simulation failed',
          })}
          : {error.message}
        </div>
      ) : !dispatches.length && !unroutedStocks.length ? (
        <div>
          <NoData
            message={formatMessage({
              id: 'dispatch_routes',
              defaultMessage: 'dispatch routes',
            })}
            Icon={<TruckIcon className="h-6 w-6" />}
          />
          <p className="mt-3 text-sm text-text-muted">
            {formatMessage({
              id: 'fulfillment_preview_empty_hint',
              defaultMessage:
                'The engine could not simulate any dispatch for this product. Customers will not see delivery options for it. Verify that at least one delivery provider and one warehousing provider are configured, active and free of configuration errors.',
            })}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {dispatches.map((dispatch, index) => (
              <div
                key={`${dispatch?.deliveryProvider?._id}-${dispatch?.warehousingProvider?._id}-${index}`}
                className="rounded-lg border border-border-default bg-surface p-4 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <TruckIcon className="h-5 w-5 shrink-0 text-text-muted" />
                    <span className="truncate text-sm font-semibold text-text-primary">
                      {providerLabel(dispatch?.deliveryProvider) ||
                        formatMessage({
                          id: 'unknown_delivery_provider',
                          defaultMessage: 'Unknown delivery provider',
                        })}
                    </span>
                  </div>
                  {dispatch?.deliveryProvider?.type && (
                    <Badge
                      text={formatMessage({
                        id: dispatch.deliveryProvider.type,
                        defaultMessage: dispatch.deliveryProvider.type,
                        description: 'Delivery provider type',
                      })}
                      color="sky"
                      square
                    />
                  )}
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-text-muted">
                      {formatMessage({
                        id: 'warehouse',
                        defaultMessage: 'Warehouse',
                      })}
                    </dt>
                    <dd className="flex items-center gap-1 text-text-primary truncate">
                      <BuildingStorefrontIcon className="h-4 w-4 shrink-0 text-text-muted" />
                      {providerLabel(dispatch?.warehousingProvider) || 'n/a'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-text-muted">
                      {formatMessage({
                        id: 'ships',
                        defaultMessage: 'Ships',
                      })}
                    </dt>
                    <dd className="text-text-primary">
                      {formatDateTime(dispatch?.shipping, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-text-muted">
                      {formatMessage({
                        id: 'earliest_delivery',
                        defaultMessage: 'Earliest delivery',
                      })}
                    </dt>
                    <dd className="text-text-primary">
                      {formatDateTime(dispatch?.earliestDelivery, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </dd>
                  </div>
                  {dispatch?.stockQuantity !== null && (
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-text-muted">
                        {formatMessage({
                          id: 'stock',
                          defaultMessage: 'Stock',
                        })}
                      </dt>
                      <dd className="font-semibold text-text-primary">
                        {formatMessage(
                          {
                            id: 'units_available',
                            defaultMessage: '{quantity} units available',
                          },
                          { quantity: dispatch.stockQuantity },
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            ))}
          </div>

          {unroutedStocks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                {formatMessage({
                  id: 'stock_without_dispatch_route',
                  defaultMessage: 'Stock without a dispatch route',
                })}
              </h3>
              <p className="mt-1 text-sm text-text-muted">
                {formatMessage({
                  id: 'stock_without_dispatch_route_hint',
                  defaultMessage:
                    'Inventory is reported for these provider combinations, but the engine could not calculate a dispatch for them.',
                })}
              </p>
              <ul className="mt-3 space-y-2">
                {unroutedStocks.map((stock, index) => (
                  <li
                    key={`${stock?.deliveryProvider?._id}-${stock?.warehousingProvider?._id}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface-subtle px-3 py-2 text-sm"
                  >
                    <span className="truncate text-text-secondary">
                      {providerLabel(stock?.warehousingProvider) || 'n/a'}
                      {stock?.deliveryProvider &&
                        ` — ${providerLabel(stock.deliveryProvider)}`}
                    </span>
                    <span className="font-semibold text-text-primary">
                      {formatMessage(
                        {
                          id: 'units_available',
                          defaultMessage: '{quantity} units available',
                        },
                        { quantity: stock?.quantity ?? 0 },
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FulfillmentPreview;
