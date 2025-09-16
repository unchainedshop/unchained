import { useIntl } from 'react-intl';
import { CreditCardIcon, TruckIcon } from '@heroicons/react/20/solid';

const OrderDetailAddresses = ({ order }) => {
  const { formatMessage } = useIntl();

  // Get delivery address from the delivery object if it's a shipping delivery
  const deliveryAddress = order?.delivery?.address || order?.billingAddress;

  return (
    <section
      aria-labelledby="addresses-heading"
      className="lg:grid lg:grid-cols-2 flex flex-col gap-8"
    >
      {/* Billing Address */}
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
              ? `${order?.billingAddress?.firstName} ${order?.billingAddress?.lastName}`
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

      {/* Delivery Address */}
      <div>
        <div className="mb-2 text-xl dark:text-slate-400 flex items-center gap-2">
          <TruckIcon className="h-5 w-5" />
          {formatMessage({
            id: 'delivery_address',
            defaultMessage: 'Delivery address',
          })}
        </div>

        <div>
          <span className="block">
            {deliveryAddress?.firstName && deliveryAddress?.lastName
              ? `${deliveryAddress.firstName} ${deliveryAddress.lastName}`
              : deliveryAddress?.firstName || deliveryAddress?.lastName || ''}
          </span>
          <span className="block">{deliveryAddress?.addressLine}</span>
          {deliveryAddress?.addressLine2 && (
            <span className="block">{deliveryAddress.addressLine2}</span>
          )}
          <span>{deliveryAddress?.postalCode}</span>
          &nbsp;
          <span>{deliveryAddress?.city}</span>
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
    </section>
  );
};

export default OrderDetailAddresses;
