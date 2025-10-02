import Link from 'next/link';
import generateUniqueId from '../../common/utils/getUniqueId';
import ImageWithFallback from '../../common/components/ImageWithFallback';
import defaultNextImageLoader from '../../common/utils/defaultNextImageLoader';
import { useIntl } from 'react-intl';
import { TOKEN_STATUSES } from '../../common/data/miscellaneous';
import Badge from '../../common/components/Badge';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import DetailHeader from '../../common/components/DetailHeader';
import shortenAddress from '../../common/utils/shortAddress';
import { useFormatPrice } from '../../common/utils/utils';

const TokenDetail = ({ token }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const { formatPrice } = useFormatPrice();

  if (!token) return null;

  return (
    <div className="grid gap-8 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
      <div className="border-b border-slate-300 dark:border-slate-700 pb-6">
        <Link
          href={`/products?slug=${generateUniqueId(token?.product)}`}
          className="block overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-700 hover:opacity-90"
        >
          <ImageWithFallback
            src={
              (token?.product?.media?.length &&
                token?.product.media[0].file?.url) ||
              '/no-image.jpg'
            }
            loader={defaultNextImageLoader}
            alt={formatMessage({
              id: 'product-image',
              defaultMessage: 'Product image',
            })}
            width={200}
            height={200}
            layout="responsive"
            className="h-full w-full object-cover"
          />
        </Link>
        <div className="mt-4">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {token?.product?.texts?.title || 'Untitled Product'}
          </h3>
          <p className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-300">
            {formatPrice(token?.product?.simulatedPrice)}
          </p>
          <p className="mt-2 text-slate-700 dark:text-slate-400">
            {formatMessage({
              id: 'item_quantity',
              defaultMessage: 'Quantity:',
            })}{' '}
            <span className="font-semibold">{token?.quantity}</span>
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <span className="block font-medium text-slate-700 dark:text-slate-300">
            {formatMessage({ id: 'status', defaultMessage: 'Status' })}
          </span>
          <Badge
            text={
              token?.status === 'CENTRALIZED' ? 'Off-Chain 🏛' : 'On-Chain ⛓'
            }
            color={TOKEN_STATUSES[token.status]}
            square
          />
        </div>

        <div>
          <span className="block font-medium text-slate-700 dark:text-slate-300">
            {formatMessage({
              id: 'chain-token-id',
              defaultMessage: 'Token Serial Number',
            })}
            :
          </span>
          <p className="text-slate-900 dark:text-slate-100">
            {token?.tokenSerialNumber}
          </p>
        </div>

        <div>
          <span className="block font-medium text-slate-700 dark:text-slate-300">
            {formatMessage({
              id: 'chain-id',
              defaultMessage: 'Chain ID {chainId}',
            })}
            :
          </span>
          <p className="text-slate-900 dark:text-slate-100">{token?.chainId}</p>
        </div>

        <div>
          <span className="block font-medium text-slate-700 dark:text-slate-300">
            {formatMessage({ id: 'order', defaultMessage: 'Order' })}:
          </span>
          <Link
            href={`/orders?orderId=${token.ercMetadata?.orderId}`}
            className="text-slate-800 dark:text-slate-700 hover:underline"
          >
            {token?.ercMetadata?.orderId}
          </Link>
        </div>

        <div>
          <span className="block font-medium text-slate-700 dark:text-slate-300">
            {formatMessage({
              id: 'invalidated',
              defaultMessage: 'Invalidated',
            })}
            :
          </span>
          <p className="text-slate-900 dark:text-slate-100">
            {token?.invalidatedDate
              ? formatDateTime(token.invalidatedDate)
              : formatMessage({ id: 'not-applicable', defaultMessage: 'N/A' })}
          </p>
        </div>

        {token?.walletAddress && (
          <div>
            <span className="block font-medium text-slate-700 dark:text-slate-300">
              {formatMessage(
                {
                  id: 'wallet-address',
                  defaultMessage: 'Wallet {walletAddress}',
                },
                {
                  walletAddress: shortenAddress(token?.walletAddress),
                },
              )}
            </span>
          </div>
        )}
      </div>

      <div className="pt-6">
        <DetailHeader user={token?.user} contact={token?.user?.lastContact} />
      </div>
    </div>
  );
};

export default TokenDetail;
