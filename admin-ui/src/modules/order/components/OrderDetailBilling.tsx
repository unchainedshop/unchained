import { useIntl } from 'react-intl';
import { useFormatPrice } from '../../common/utils/utils';

const OrderDetailBilling = ({ order }) => {
  const { formatMessage } = useIntl();
  const { formatPrice } = useFormatPrice();

  const isCart = order?.status === 'OPEN' || !order?.orderNumber;

  return (
    <div aria-labelledby="summary-heading">
      <div>
        <div className="flex items-center justify-between pb-3 text-xl">
          <dt className="">
            {formatMessage({
              id: 'order_total',
              defaultMessage: 'Order total',
            })}
          </dt>
          <dd className="">{formatPrice(order?.total)}</dd>
        </div>

        {!isCart && (
          <>
            <div className="flex items-center justify-between">
              <dt className="text-slate-600 dark:text-slate-400">
                {formatMessage({
                  id: 'discount',
                  defaultMessage: 'Discount',
                })}
              </dt>
              <dd className="">{formatPrice(order?.totalDiscount)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-600 dark:text-slate-400">
                {formatMessage({
                  id: 'shipping',
                  defaultMessage: 'Shipping',
                })}
              </dt>
              <dd className="">{formatPrice(order?.totalDelivery)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-600 dark:text-slate-400">
                {formatMessage({
                  id: 'tax',
                  defaultMessage: 'Tax',
                })}
              </dt>
              <dd className="">{formatPrice(order?.totalTax)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-600 dark:text-slate-400">
                {formatMessage({
                  id: 'order_payment_fees',
                  defaultMessage: 'Fees',
                })}
              </dt>
              <dd className="">{formatPrice(order?.totalPayment)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-600 dark:text-slate-400">
                {formatMessage({
                  id: 'subtotal',
                  defaultMessage: 'Subtotal',
                })}
              </dt>
              <dd className="">{formatPrice(order?.itemsTotal)}</dd>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderDetailBilling;
