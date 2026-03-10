import Link from 'next/link';
import Table from '../../common/components/Table';
import Badge from '../../common/components/Badge';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import ImageWithFallback from '../../common/components/ImageWithFallback';
import defaultNextImageLoader from '../../common/utils/defaultNextImageLoader';
import generateUniqueId from '../../common/utils/getUniqueId';

const EVENT_STATUSES = {
  ACTIVE: 'emerald',
  DRAFT: 'amber',
  DELETED: 'rose',
};

const TicketEventListItem = ({ product }) => {
  const { formatDateTime } = useFormatDateTime();
  const slot = product?.contractConfiguration?.ercMetadataProperties?.slot;

  const supply = product?.contractConfiguration?.supply || 0;
  const remaining =
    product?.simulatedStocks?.reduce((acc, cur) => acc + cur.quantity, 0) || 0;
  const sold = supply - remaining;
  const ticketUrl = `/ticketing?slug=${generateUniqueId(product)}`;
  return (
    <Table.Row key={product._id}>
      <Table.Cell>
        <Link
          href={ticketUrl}
          className="block w-12 h-12 overflow-hidden rounded-md bg-slate-50 dark:bg-slate-700"
        >
          <ImageWithFallback
            src={product?.media?.[0]?.file?.url || '/no-image.jpg'}
            loader={defaultNextImageLoader}
            alt={product?.texts?.title || ''}
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        </Link>
      </Table.Cell>
      <Table.Cell>
        <Link
          href={ticketUrl}
          className="font-medium text-slate-800 dark:text-slate-200 hover:underline"
        >
          {product?.texts?.title || 'Untitled'}
          {product?.texts?.subtitle && (
            <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
              {product.texts.subtitle}
            </span>
          )}
        </Link>
      </Table.Cell>
      <Table.Cell>
        <div className="text-sm text-slate-700 dark:text-slate-300">
          {slot
            ? formatDateTime(slot, {
                month: 'short',
                year: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
              })
            : '-'}
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {sold}
          </span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-500 dark:text-slate-400">{supply}</span>
          {supply > 0 && (
            <div className="ml-2 h-2 w-20 rounded-full bg-slate-200 dark:bg-slate-600">
              <div
                className="h-2 rounded-full bg-emerald-500"
                style={{
                  width: `${Math.min(100, (sold / supply) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      </Table.Cell>
      <Table.Cell>
        <Badge
          text={product?.status}
          color={EVENT_STATUSES[product?.status] || 'slate'}
          square
        />
      </Table.Cell>
    </Table.Row>
  );
};

export default TicketEventListItem;
