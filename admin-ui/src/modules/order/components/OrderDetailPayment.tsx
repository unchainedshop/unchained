import { useIntl } from 'react-intl';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

import AlertMessage from '../../modal/components/AlertMessage';
import useModal from '../../modal/hooks/useModal';
import usePayOrder from '../hooks/usePayOrder';
import { getInterfaceLabel, useFormatPrice } from '../../common/utils/utils';
import usePaymentProviderTypes from '../../payment-providers/hooks/usePaymentProviderTypes';
import usePaymentStatusTypes from '../../payment-providers/hooks/usePaymentStatusTypes';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import StatusInformation from '../../common/components/StatusInformation';
import useAuth from '../../Auth/useAuth';

const OrderDetailPayment = ({ order }) => {
  const { paymentProviderType } = usePaymentProviderTypes();
  const { paymentStatusTypes } = usePaymentStatusTypes();
  const { formatDateTime } = useFormatDateTime();
  const { formatPrice } = useFormatPrice();

  const { formatMessage } = useIntl();
  const { setModal } = useModal();
  const { payOrder } = usePayOrder();
  const { hasRole } = useAuth();

  const markAsPaid = async () => {
    await setModal(
      <AlertMessage
        buttonText={formatMessage({
          id: 'pay',
          defaultMessage: 'Mark paid',
        })}
        message={formatMessage({
          id: 'mark_as_paid_question',
          defaultMessage: 'This will change the order payment status to Paid.',
        })}
        headerText={formatMessage({
          id: 'mark_as_paid_question_header',
          defaultMessage: 'Mark as paid?',
        })}
        onOkClick={async () => {
          setModal('');
          await payOrder({ orderId: order._id });
          toast.success(
            formatMessage({
              id: 'order_paid',
              defaultMessage: 'Order payed successfully',
            }),
          );
        }}
      />,
    );
  };

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <h2 className="pt-4 text-2xl text-slate-900 dark:text-slate-200">
          {formatMessage({
            id: 'payment',
            defaultMessage: 'Payment',
          })}
        </h2>
        {order?.payment?.fee?.currencyCode && (
          <span className="block">{formatPrice(order.payment.fee)}</span>
        )}
        {order?.payment?.paid && (
          <span className="font-mono">
            {formatDateTime(order.payment.paid, {
              timeStyle: 'short',
              dateStyle: 'medium',
            })}
          </span>
        )}
      </div>

      <div>
        <span className="mb-5 block text-xs font-mono">
          {order?.payment?.provider && (
            <Link
              href={`/payment-provider?paymentProviderId=${order.payment.provider._id}`}
              className="text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-600"
            >
              {getInterfaceLabel(order.payment?.provider?.interface)}
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
          {[...paymentProviderType]
            .sort((a, b) => {
              // Put the active method first
              if (a.value === order.payment?.provider?.type) return -1;
              if (b.value === order.payment?.provider?.type) return 1;
              return 0;
            })
            .map((type) => (
              <StatusInformation
                key={type.value}
                enumType={type.value}
                currentType={order.payment?.provider?.type}
                label={type.label}
              />
            ))}
        </span>
        <div className="mt-3 text-sm text-slate-500 dark:text-slate-200">
          {formatMessage({
            id: 'delivery_status',
            defaultMessage: 'Status',
          })}
        </div>
        <span className="mr-2 block rounded-full py-1 text-xs font-semibold leading-5">
          {[...paymentStatusTypes]
            .sort((a, b) => {
              // Put the active status first
              if (a.value === order.payment?.status) return -1;
              if (b.value === order.payment?.status) return 1;
              return 0;
            })
            .map((type) => (
              <StatusInformation
                key={type.value}
                enumType={type.value}
                currentType={order.payment?.status}
                label={type.label}
                component={
                  order.payment.status === 'OPEN' &&
                  type.value === 'PAID' &&
                  hasRole('markOrderPaid') && (
                    <button
                      id="pay"
                      type="button"
                      onClick={markAsPaid}
                      className="cursor-pointer my-2 mr-2 inline-flex h-full items-center justify-center rounded-sm border border-transparent bg-slate-800 dark:bg-slate-600 py-1 px-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-950 dark:hover:bg-slate-500 focus:outline-hidden focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-400 focus:ring-offset-2"
                    >
                      <span className="mr-1">
                        <PlusIcon className="inline-block h-3 w-3 text-white" />
                      </span>
                      {formatMessage({
                        id: 'mark_as_paid',
                        defaultMessage: 'Mark as Paid',
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

export default OrderDetailPayment;
