import Link from 'next/link';
import { useIntl } from 'react-intl';
import { Table, Badge, ImageWithFallback } from '@unchainedshop/admin-ui/ui';
import { useFormatDateTime, generateUniqueId, defaultNextImageLoader } from '../utils/misc.ts';

const EVENT_STATUSES = {
  ACTIVE: 'emerald',
  DRAFT: 'amber',
  DELETED: 'rose',
};

const TicketEventListItem = ({ product }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  const supply = product?.contractConfiguration?.supply || 0;
  const remaining = product?.simulatedStocks?.reduce((acc, cur) => acc + cur.quantity, 0) || 0;
  // Without a supply there is no stock to subtract from: count the issued tickets instead.
  const sold = supply > 0 ? Math.max(0, supply - remaining) : product?.tokensCount || 0;
  // A cancelled event has no stock left, which says nothing about sales.
  const showSales = !product?.event?.isCanceled;
  const ticketUrl = `/ext/ticketing/${generateUniqueId(product)}`;

  return (
    <Table.Row key={product._id}>
      <Table.Cell>
        <Link href={ticketUrl} className="block w-12 h-12 overflow-hidden rounded-md bg-surface-raised">
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
        <Link href={ticketUrl} className="font-medium text-text-primary hover:underline">
          {product?.texts?.title || 'Untitled'}
          {product?.texts?.subtitle && (
            <span className="ml-2 text-sm text-text-muted">{product.texts.subtitle}</span>
          )}
        </Link>
        {product?.event?.category && (
          <div className="mt-1">
            <Badge text={product.event?.category} color="slate" square />
          </div>
        )}
      </Table.Cell>
      <Table.Cell>
        <div className="text-sm text-text-secondary">
          {product?.event?.startsAt
            ? formatDateTime(product.event?.startsAt, {
                weekday: 'short',
                month: 'short',
                year: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
              })
            : '-'}
        </div>
        {product?.event?.location && (
          <div className="text-sm text-text-muted">{product.event?.location}</div>
        )}
      </Table.Cell>
      <Table.Cell>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-text-primary">{showSales ? sold : '-'}</span>
          {showSales && supply > 0 && (
            <>
              <span className="text-text-muted">/</span>
              <span className="text-text-muted">{supply}</span>
              <div className="ml-2 h-2 w-20 rounded-full bg-surface-raised">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{
                    width: `${Math.min(100, (sold / supply) * 100)}%`,
                  }}
                />
              </div>
            </>
          )}
        </div>
      </Table.Cell>
      <Table.Cell>
        <Badge
          text={
            product?.event?.isCanceled
              ? formatMessage({ id: 'event_status_cancelled', defaultMessage: 'CANCELLED' })
              : product?.status
          }
          color={product?.event?.isCanceled ? 'rose' : EVENT_STATUSES[product?.status] || 'slate'}
          square
        />
      </Table.Cell>
    </Table.Row>
  );
};

export default TicketEventListItem;
