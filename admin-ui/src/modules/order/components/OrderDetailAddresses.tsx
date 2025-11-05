import { useIntl } from 'react-intl';
import {
  CreditCardIcon,
  TruckIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/20/solid';

const OrderDetailAddresses = ({ order }) => {
  const { formatMessage } = useIntl();

  const delivery = order?.delivery;
  const isPickup = delivery?.provider?.type === 'PICKUP';
  const deliveryAddress =
    delivery?.address || delivery?.activePickUpLocation?.address || {};

  const pickupLocationName = delivery?.activePickUpLocation?.name;

  return (
    <section
      aria-labelledby="addresses-heading"
      className="lg:grid lg:grid-cols-2 flex flex-col gap-8"
    >
      <div>
        <div className="mb-2 text-xl dark:text-slate-400 flex items-center gap-2">
          <CreditCardIcon className="h-5 w-5" />
          {formatMessage({
            id: 'billing_address',
            defaultMessage: 'Billing address',
          })}
        </div>

        <div>
          <span className="block">
            {order?.billingAddress?.firstName && order?.billingAddress?.lastName
              ? `${order.billingAddress.firstName} ${order.billingAddress.lastName}`
              : order?.billingAddress?.firstName ||
                order?.billingAddress?.lastName ||
                ''}
          </span>
          <span className="block">{order?.billingAddress?.addressLine}</span>
          {order?.billingAddress?.addressLine2 && (
            <span className="block">{order.billingAddress.addressLine2}</span>
          )}
          <span>{order?.billingAddress?.postalCode}</span>
          &nbsp;
          <span>{order?.billingAddress?.city}</span>
          <span className="block">
            {order?.country?.name && (
              <>
                {order.country.name}{' '}
                <span className="inline-block grayscale hover:grayscale-0 transition-all text-xl">
                  {order.country.flagEmoji}
                </span>
              </>
            )}
          </span>
        </div>
      </div>

      <div>
        <div className="mb-2 text-xl dark:text-slate-400 flex items-center gap-2">
          <TruckIcon className="h-5 w-5" />
          {formatMessage({
            id: 'delivery_details',
            defaultMessage: 'Delivery details',
          })}
        </div>
        <div>
          {isPickup ? (
            <div className="mb-1 flex items-center gap-1">
              <BuildingStorefrontIcon className="h-5 w-5 text-gray-500" />
              <span className="font-semibold">
                {pickupLocationName ||
                  formatMessage({
                    id: 'pickup_location',
                    defaultMessage: 'Pickup Location',
                  })}
              </span>
            </div>
          ) : null}
          <div>
            <span className="block">
              {deliveryAddress?.firstName && deliveryAddress?.lastName
                ? `${deliveryAddress.firstName} ${deliveryAddress.lastName}`
                : deliveryAddress?.firstName || deliveryAddress?.lastName || ''}
            </span>
            {deliveryAddress?.company && (
              <span className="block">{deliveryAddress.company}</span>
            )}
            <span className="block">{deliveryAddress?.addressLine}</span>
            {deliveryAddress?.addressLine2 && (
              <span className="block">{deliveryAddress.addressLine2}</span>
            )}
            <span>{deliveryAddress?.postalCode}</span>
            &nbsp;
            <span>{deliveryAddress?.city}</span>
            <span className="block text-gray-500 text-sm">
              {deliveryAddress?.regionCode} — {deliveryAddress?.countryCode}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderDetailAddresses;
