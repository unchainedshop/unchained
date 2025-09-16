import { useIntl } from 'react-intl';
import Link from 'next/link';
import { useFormatPrice } from '../../common/utils/utils';
import generateUniqueId from '../../common/utils/getUniqueId';
import ImageWithFallback from '../../common/components/ImageWithFallback';

const OrderDetailItem = ({ item }) => {
  const { formatMessage } = useIntl();
  const { formatPrice } = useFormatPrice();
  return (
    <Link href={`/products?slug=${generateUniqueId(item.product)}`}>
      <div className="space-y-8">
        <div className="flex items-center flex-wrap">
          <div className="flex shrink-0 overflow-hidden rounded-lg sm:mx-0 ">
            {item.product?.media?.length ? (
              <ImageWithFallback
                src={`${item.product?.media[0].file.url}`}
                alt={
                  item?.product?.texts?.title || item?.product?.texts?.subtitle
                }
                className="object-cover object-center"
                width={80}
                height={80}
              />
            ) : null}
          </div>

          <div className="flex flex-col justify-center sm:mt-0 ml-3 sm:flex-auto">
            <h3
              className="text-base text-slate-900 dark:text-slate-200 truncate"
              dangerouslySetInnerHTML={{
                __html:
                  item?.product?.texts?.title || item?.product?.texts?.subtitle,
              }}
            />
            <div className="mt-1 text-sm dark:text-slate-400">
              {formatPrice(item?.unitPrice)}
            </div>
            <div className="mt-1 text-sm dark:text-slate-400">
              {formatMessage({
                id: 'item_quantity',
                defaultMessage: 'Quantity:',
              })}
              <span className="ml-1">{item?.quantity}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default OrderDetailItem;
