import Link from 'next/link';
import { useIntl } from 'react-intl';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

import Loading from '@/components/ui/Loading';
import NoData from '@/components/ui/NoData';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { IRoleAction } from '../../../gql/types';
import useAuth from '../../Auth/useAuth';
import useUserCart from '../../order/hooks/useUserCart';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import { useFormatPrice } from '../../common/utils/utils';
import generateUniqueId from '../../common/utils/getUniqueId';

const UserCart = ({ _id: userId }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const { formatPrice } = useFormatPrice();
  const { hasRole } = useAuth();
  const { cart, loading } = useUserCart({ userId });

  if (loading) return <Loading />;

  if (!cart)
    return (
      <div className="mt-4">
        <NoData
          message={formatMessage({
            id: 'active_cart',
            defaultMessage: 'Active cart',
          })}
          Icon={<ShoppingCartIcon className="h-6 w-6" />}
        />
      </div>
    );

  return (
    <div className="mt-4">
      <div className="rounded-md border border-border-default bg-surface shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default px-4 py-3">
          <div className="flex items-center gap-3">
            <ShoppingCartIcon className="h-5 w-5 text-text-muted" />
            <span className="text-sm text-text-muted">
              {formatMessage(
                {
                  id: 'cart_last_updated',
                  defaultMessage: 'Last updated {date}',
                },
                {
                  date: formatDateTime(cart.updated || cart.created, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }),
                },
              )}
            </span>
            {cart.country?.isoCode && (
              <span className="text-sm text-text-muted">
                {cart.country?.flagEmoji} {cart.country.isoCode}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-text-primary">
              {formatPrice(cart.total)}
            </span>
            {hasRole(IRoleAction.ViewOrders) && (
              <Link
                href={`/orders?orderId=${cart._id}`}
                className="text-sm text-accent hover:underline"
              >
                {formatMessage({
                  id: 'view_cart',
                  defaultMessage: 'View cart',
                })}
              </Link>
            )}
          </div>
        </div>
        <ul className="divide-y divide-border-default">
          {cart.items?.map((item) => (
            <li key={item._id} className="flex items-center gap-4 px-4 py-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border-subtle">
                <ImageWithFallback
                  src={item.product?.media?.[0]?.file?.url}
                  width={48}
                  height={48}
                  className="h-12 w-12 object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/products?slug=${generateUniqueId(item.product)}`}
                  className="block truncate text-sm font-medium text-text-primary hover:underline"
                >
                  {item.product?.texts?.title ||
                    item.product?.texts?.subtitle ||
                    item.product?._id}
                </Link>
                <span className="text-sm text-text-muted">
                  {item.quantity} × {formatPrice(item.unitPrice)}
                </span>
              </div>
              <span className="text-sm font-medium text-text-primary">
                {formatPrice(item.total)}
              </span>
            </li>
          ))}
          {!cart.items?.length && (
            <li className="px-4 py-3 text-sm text-text-muted">
              {formatMessage({
                id: 'cart_empty',
                defaultMessage: 'Cart is empty',
              })}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default UserCart;
