import { useIntl } from 'react-intl';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import DetailHeader from '../../common/components/DetailHeader';

const OrderDetailHeader = ({ order }) => {
  const { formatMessage, locale } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  if (!order) return null;

  const isCart = order?.status === 'OPEN' || !order?.orderNumber;
  return (
    <div>
      <div className="flex justify-between items-baseline flex-wrap mb-10">
        <div className="flex items-center justify-between gap-5 flex-wrap">
          <h2 className="text-2xl font-medium text-slate-900 dark:text-slate-200 sm:truncate sm:text-3xl lg:text-4xl xl:text-5xl">
            {isCart ? (
              <>
                {formatMessage({
                  id: 'cart',
                  defaultMessage: 'Cart',
                })}
                {` ${order._id}`}
              </>
            ) : (
              <>
                {formatMessage({
                  id: 'order_number',
                  defaultMessage: 'Order #',
                })}
                {order?.orderNumber ? `${order.orderNumber}` : ''}
              </>
            )}
          </h2>
        </div>
        <div>
          <span className="mr-1 text-slate-400 dark:text-slate-500">
            {isCart
              ? formatMessage({
                  id: 'cart_created',
                  defaultMessage: 'Warenkorb erstellt',
                })
              : formatMessage({
                  id: 'order_placed',
                  defaultMessage: 'Order placed',
                })}
          </span>
          {isCart
            ? formatDateTime(order.created)
            : order?.ordered
              ? formatDateTime(order.ordered)
              : null}
        </div>
      </div>

      {!isCart && <DetailHeader user={order?.user} contact={order?.contact} />}

      {isCart && order?.user && (
        <div className="mt-5">
          <span className="text-lg text-slate-600 dark:text-slate-400">
            {order.user.profile?.displayName ||
              (order.user.profile?.address?.firstName &&
              order.user.profile?.address?.lastName
                ? `${order.user.profile.address.firstName} ${order.user.profile.address.lastName}`
                : order.user.username) ||
              'Guest'}
          </span>
        </div>
      )}
    </div>
  );
};

export default OrderDetailHeader;
