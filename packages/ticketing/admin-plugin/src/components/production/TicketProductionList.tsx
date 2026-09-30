import Link from 'next/link';
import { useIntl } from 'react-intl';
import { Table, Badge, ImageWithFallback } from '@unchainedshop/admin-ui/ui';
import { generateUniqueId, defaultNextImageLoader } from '../../utils/misc.ts';

const PRODUCTION_STATUSES = {
  ACTIVE: 'emerald',
  DRAFT: 'amber',
  DELETED: 'rose',
};

const TicketProductionList = ({ productions }) => {
  const { formatMessage } = useIntl();

  return (
    <Table className="min-w-full">
      <Table.Row header>
        <Table.Cell> </Table.Cell>
        <Table.Cell>{formatMessage({ id: 'title', defaultMessage: 'Title' })}</Table.Cell>
        <Table.Cell>
          {formatMessage({ id: 'ticket_categories', defaultMessage: 'Ticket categories' })}
        </Table.Cell>
        <Table.Cell>
          {formatMessage({ id: 'production_tickets', defaultMessage: 'Ticket products' })}
        </Table.Cell>
        <Table.Cell>{formatMessage({ id: 'status', defaultMessage: 'Status' })}</Table.Cell>
      </Table.Row>
      {(productions || []).map((production) => {
        const url = `/ext/ticketing/${generateUniqueId(production)}`;
        return (
          <Table.Row key={production._id}>
            <Table.Cell>
              <Link href={url} className="block h-12 w-12 overflow-hidden rounded-md bg-surface-raised">
                <ImageWithFallback
                  src={production?.media?.[0]?.file?.url || '/no-image.jpg'}
                  loader={defaultNextImageLoader}
                  alt={production?.texts?.title || ''}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </Link>
            </Table.Cell>
            <Table.Cell>
              <Link href={url} className="font-medium text-text-primary hover:underline">
                {production?.texts?.title || 'Untitled'}
                {production?.texts?.subtitle && (
                  <span className="ml-2 text-sm text-text-muted">{production.texts.subtitle}</span>
                )}
              </Link>
              {production?.ticketProduction?.location && (
                <div className="text-sm text-text-muted">{production.ticketProduction.location}</div>
              )}
            </Table.Cell>
            <Table.Cell>
              <div className="flex flex-wrap gap-1">
                {(production?.ticketProduction?.categories ?? []).map(({ code }) => (
                  <Badge key={code} text={code} color="slate" square />
                ))}
              </div>
            </Table.Cell>
            <Table.Cell>
              <span className="text-sm text-text-secondary">{production?.assignments?.length ?? 0}</span>
            </Table.Cell>
            <Table.Cell>
              <Badge
                text={production?.status}
                color={PRODUCTION_STATUSES[production?.status] || 'slate'}
                square
              />
            </Table.Cell>
          </Table.Row>
        );
      })}
    </Table>
  );
};

export default TicketProductionList;
