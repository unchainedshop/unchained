import { useIntl } from 'react-intl';
import { IRoleAction } from '../../../gql/types';

import { toast } from 'react-toastify';

import OrderDetailItem from './OrderDetailItem';

import OrderDetailBilling from './OrderDetailBilling';
import OrderDetailPayment from './OrderDetailPayment';
import OrderDetailDelivery from './OrderDetailDelivery';
import OrderDetailAddresses from './OrderDetailAddresses';
import DiscountList from './DiscountList';
import useOrderStatusTypes from '../hooks/useOrderStatusTypes';

import useConfirmOrder from '../hooks/useConfirmOrder';
import useModal from '../../modal/hooks/useModal';
import AlertMessage from '../../modal/components/AlertMessage';
import StatusProgress from '../../common/components/StatusProgress';
import OrderDetailHeader from './OrderDetailHeader';
import useRejectOrder from '../hooks/useRejectOrder';
import DangerMessage from '../../modal/components/DangerMessage';
import useAuth from '../../Auth/useAuth';

const isWaitingForConfirmation = (order) => {
  return order?.status === 'PENDING';
};

const OrderDetail = ({ order }) => {
  const { formatMessage } = useIntl();
  const { setModal } = useModal();
  const { confirmOrder } = useConfirmOrder();
  const { rejectOrder } = useRejectOrder();
  const { hasRole } = useAuth();

  const { orderStatusType } = useOrderStatusTypes();

  if (!order) return null;

  const isCart = order?.status === 'OPEN' || !order?.orderNumber;

  const onConfirmOrder = async () => {
    await setModal(
      <AlertMessage
        buttonText={formatMessage({
          id: 'confirm_order_alert_button',
          defaultMessage: 'Confirm',
        })}
        headerText={formatMessage({
          id: 'confirm_order_alert_header',
          defaultMessage: 'Confirm order?',
        })}
        message={formatMessage({
          id: 'confirm_order_alert_message',
          defaultMessage: 'This will mark order as confirmed',
        })}
        onOkClick={async () => {
          setModal('');
          await confirmOrder({ orderId: order._id });
          toast.success(
            formatMessage({
              id: 'order_confirmed_success',
              defaultMessage: 'Order confirmed successfully',
            }),
          );
        }}
      />,
    );
  };

  const onRejectOrder = async () => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        okText={formatMessage({
          id: 'reject_order_alert_button',
          defaultMessage: 'Reject',
        })}
        headerText={formatMessage({
          id: 'reject_order_alert_header',
          defaultMessage: 'Reject order?',
        })}
        onOkClick={async () => {
          setModal('');
          await rejectOrder({ orderId: order._id });
          toast.success(
            formatMessage({
              id: 'order_reject_success',
              defaultMessage: 'Order rejected successfully',
            }),
          );
        }}
      />,
    );
  };

  const timeline = {
    OPEN: {
      id: 1,
      content: 'created',
      visible: true,
    },
    PENDING: {
      id: 2,
      content: 'ordered',
      Component: isWaitingForConfirmation(order) && (
        <>
          {hasRole(IRoleAction.MarkOrderConfirmed) && (
            <button
              id="confirm_order"
              onClick={onConfirmOrder}
              type="button"
              className="bg-white-300 relative -ml-px inline-flex items-center space-x-2 rounded-md border border-slate-900 dark:border-slate-600 bg-slate-800 dark:bg-slate-600 px-2 py-1 text-sm font-medium text-white hover:bg-slate-950 dark:hover:bg-slate-500  dark:focus:border-slate-400 focus:outline-hidden focus:ring-0 focus:ring-slate-800 dark:focus:ring-slate-400"
            >
              {formatMessage({
                id: 'confirm_order',
                defaultMessage: 'Confirm order',
              })}
            </button>
          )}
          {hasRole(IRoleAction.MarkOrderRejected) && (
            <button
              id="reject_order"
              onClick={onRejectOrder}
              type="button"
              className="bg-white-300 relative -ml-px inline-flex items-center space-x-2 rounded-md border border-rose-500 bg-rose-500 px-2 py-1 text-sm font-medium text-white hover:bg-rose-700 focus:border-rose-400 focus:outline-hidden focus:ring-0 focus:ring-rose-400"
            >
              {formatMessage({
                id: 'reject_order',
                defaultMessage: 'Reject order',
              })}
            </button>
          )}
        </>
      ),
      visible: true,
    },
    REJECTED: {
      id: 3,
      content: 'rejected',
      visible: order?.status === 'REJECTED',
    },
    CONFIRMED: {
      id: 4,
      content: 'confirmed',
      visible: order?.status !== 'REJECTED',
    },
    FULLFILLED: {
      id: 5,
      content: 'fullfilled',
      visible: order?.status !== 'REJECTED',
    },
  };

  return (
    <div className="space-y-4 lg:gap-10 dark:text-slate-200">
      <div>
        <OrderDetailHeader order={order} />
      </div>

      {!isCart && (
        <div className="mt-10">
          <OrderDetailAddresses order={order} />
        </div>
      )}

      <div className="mt-20 lg:grid lg:grid-cols-2 lg:gap-10">
        <div>
          <div className="mb-6 text-xl dark:text-slate-400">
            {formatMessage({
              id: 'items_purchased',
              defaultMessage: 'Items purchased',
            })}
          </div>
          <div className="flex gap-5 flex-col">
            {order?.items.map((item) => {
              return <OrderDetailItem key={item._id} item={item} />;
            })}
          </div>
        </div>
        <div>
          <OrderDetailBilling order={order} />
        </div>
      </div>

      <div className="mt-20">
        <StatusProgress
          data={order}
          statusTypes={orderStatusType}
          timeline={timeline}
        />
      </div>

      {!isCart && (
        <div className="mt-10 lg:mt-30 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-10">
          <OrderDetailDelivery order={order} />
          <OrderDetailPayment order={order} />
          <DiscountList discounts={order?.discounts} />
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
