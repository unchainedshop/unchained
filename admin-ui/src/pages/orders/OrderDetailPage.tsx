import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import Loading from '../../modules/common/components/Loading';
import PageHeader from '../../modules/common/components/PageHeader';
import useOrder from '../../modules/order/hooks/useOrder';
import OrderDetail from '../../modules/order/components/OrderDetail';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import useModal from '../../modules/modal/hooks/useModal';
import useRemoveOrder from '../../modules/order/hooks/useRemoveOrder';
import HeaderDeleteButton from '../../modules/common/components/HeaderDeleteButton';
import useAuth from '../../modules/Auth/useAuth';

const OrderDetailPage = ({ orderId }) => {
  const { formatMessage } = useIntl();
  const { setModal } = useModal();
  const { removeOrder } = useRemoveOrder();
  const router = useRouter();
  const { hasRole } = useAuth();
  const { order, loading } = useOrder({ orderId: orderId as string });

  const isDeletable = (status) => {
    return status === 'OPEN';
  };

  const handleOnClick = async () => {
    await setModal(
      <DangerMessage
        message={formatMessage({
          id: 'delete_order_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this order? ',
        })}
        onCancelClick={async () => setModal('')}
        onOkClick={async () => {
          setModal('');
          await removeOrder({ orderId: orderId as string });

          toast.success(
            formatMessage({
              id: 'order_deleted',
              defaultMessage: 'Order deleted successfully',
            }),
          );
          router.push('/orders');
        }}
        okText={formatMessage({
          id: 'delete_order',
          defaultMessage: 'Delete order',
        })}
      />,
    );
  };

  return (
    <div className="mt-5 max-w-full">
      <BreadCrumbs
        currentPageTitle={order?.orderNumber ? `#${order?.orderNumber}` : ''}
      />
      <div className="items-center flex min-w-full justify-end gap-3 flex-wrap">
        {order && isDeletable(order.status) && hasRole('updateOrder') ? (
          <HeaderDeleteButton onClick={handleOnClick} />
        ) : null}
      </div>
      {loading ? <Loading /> : <OrderDetail order={order} />}
    </div>
  );
};

export default OrderDetailPage;
