import { useIntl } from 'react-intl';
import Link from 'next/link';

import { PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { getInterfaceLabel, useFormatPrice } from '../../common/utils/utils';
import useDeliveryProviderTypes from '../../delivery-provider/hooks/useDeliveryProviderTypes';
import useDeliveryStatusTypes from '../../delivery-provider/hooks/useDeliveryStatusTypes';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import AlertMessage from '../../modal/components/AlertMessage';
import useModal from '../../modal/hooks/useModal';
import useDeliverOrder from '../hooks/useDeliverOrder';
import StatusInformation from '../../common/components/StatusInformation';
import useAuth from '../../Auth/useAuth';

const OrderDetailDelivery = ({ order }) => {
  const { deliveryProviderType } = useDeliveryProviderTypes();
  const { setModal } = useModal();
  const { deliveryStatusType } = useDeliveryStatusTypes();
  const { deliverOrder } = useDeliverOrder();
  const { formatPrice } = useFormatPrice();
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const { hasRole } = useAuth();

  const markAsDelivered = async () => {
    await setModal(
      <AlertMessage
        buttonText={formatMessage({
          id: 'delivered',
          defaultMessage: 'Delivered',
        })}
        message={formatMessage({
          id: 'mark_as_delivered_message',
          defaultMessage:
            'This will change the order delivery status to delivered',
        })}
        headerText={formatMessage({
          id: 'mark_as_delivered_question',
          defaultMessage: 'Mark as delivered ?',
        })}
        onOkClick={async () => {
          setModal('');
          await deliverOrder({ orderId: order._id });
          toast.success(
            formatMessage({
              id: 'order__marked_delivered',
              defaultMessage: 'Order marked as delivered successfully',
            }),
          );
        }}
      />,
    );
  };

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <h2 className="pt-4 text-2xl">
          {formatMessage({
            id: 'delivery',
            defaultMessage: 'Delivery',
          })}
        </h2>
        {order?.delivery?.fee?.currencyCode && (
          <span className="block">{formatPrice(order.delivery.fee)}</span>
        )}
        {order?.delivery?.delivered && (
          <span className="font-mono">
            {formatDateTime(order.delivery.delivered, {
              timeStyle: 'short',
              dateStyle: 'medium',
            })}
          </span>
        )}
      </div>
      <div>
        <span className="mb-5 block font-mono text-xs">
          {order?.delivery && (
            <Link
              href={`/delivery-provider?deliveryProviderId=${order?.delivery?.provider?._id}`}
              className="text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-600"
            >
              {getInterfaceLabel(order?.delivery?.provider?.interface)}
            </Link>
          )}
        </span>

        <div className="mt-3 text-sm text-slate-500 dark:text-slate-200">
          {formatMessage({
            id: 'method',
            defaultMessage: 'Method',
          })}
        </div>
        <span className="mr-2 block rounded-full py-1 text-xs font-semibold leading-5">
          {[...deliveryProviderType]
            .sort((a, b) => {
              // Put the active method first
              if (a.value === order?.delivery?.provider?.type) return -1;
              if (b.value === order?.delivery?.provider?.type) return 1;
              return 0;
            })
            .map((type) => (
              <StatusInformation
                key={type.value}
                enumType={type.value}
                currentType={order?.delivery?.provider?.type}
                label={type.label}
              />
            ))}
        </span>

        <div className="mt-3 text-sm text-slate-500 dark:text-slate-200">
          {formatMessage({
            id: 'status',
            defaultMessage: 'Status',
          })}
        </div>
        <span className="mr-2 block rounded-full py-1 text-xs font-semibold leading-5">
          {[...deliveryStatusType]
            .sort((a, b) => {
              // Put the active status first
              if (a.value === order?.delivery?.status) return -1;
              if (b.value === order?.delivery?.status) return 1;
              return 0;
            })
            .map((type) => (
              <StatusInformation
                key={type.value}
                enumType={type.value}
                currentType={order?.delivery?.status}
                label={type.label}
                component={
                  order?.delivery?.status === 'OPEN' &&
                  type.value === 'DELIVERED' &&
                  hasRole('markOrderDelivered') && (
                    <button
                      id="deliver"
                      type="button"
                      onClick={markAsDelivered}
                      className="my-2  mr-2  inline-flex  h-full  items-center justify-center  rounded-sm border border-slate-300 border-transparent bg-slate-800 dark:bg-slate-600 py-1 px-2 text-xs font-semibold text-white  shadow-xs hover:bg-slate-950 dark:hover:bg-slate-500 focus:outline-hidden focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-400 focus:ring-offset-2"
                    >
                      <span className="mr-1">
                        <PlusIcon className="inline-block h-3 w-3 text-white" />
                      </span>
                      {formatMessage({
                        id: 'mark_as_delivered',
                        defaultMessage: 'Mark as delivered',
                      })}
                    </button>
                  )
                }
              />
            ))}
        </span>
      </div>
    </div>
  );
};

export default OrderDetailDelivery;
