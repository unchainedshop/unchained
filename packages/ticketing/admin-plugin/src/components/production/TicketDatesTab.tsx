import Link from 'next/link';
import { useAuth } from '@unchainedshop/admin-ui/hooks';
import { Fragment, useState } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import { Badge, Button, NoData, Table } from '@unchainedshop/admin-ui/ui';
import { DangerMessage } from '@unchainedshop/admin-ui/modal';
import { useModal } from '@unchainedshop/admin-ui/hooks';
import useTicketProductionMutations from '../../hooks/useTicketProductionMutations.ts';
import { buildPerformanceGrid, type PerformanceRow } from '../../utils/production-grid.ts';
import { generateUniqueId, useFormatDateTime, useFormatPrice } from '../../utils/misc.ts';
import TicketDateForm from './TicketDateForm.tsx';
import { errorMessage } from './fields.tsx';

// Sold / capacity and price of one category in one date, linking to its tickets and attendees.
const TicketCell = ({ product }) => {
  const { formatPrice } = useFormatPrice();
  if (!product) return <span className="text-text-muted">-</span>;
  const supply = product.contractConfiguration?.supply;
  return (
    <Link href={`/ext/ticketing/${generateUniqueId(product)}`} className="block hover:underline">
      <span className="font-medium text-text-primary">{product.tokensCount ?? 0}</span>
      {supply > 0 && <span className="text-text-muted"> / {supply}</span>}
      {product.catalogPrice && (
        <span className="ml-2 text-xs text-text-muted">{formatPrice(product.catalogPrice)}</span>
      )}
    </Link>
  );
};

/**
 * The dates of a production: a row per start with sold / capacity and price per ticket category.
 * Dates are added, changed (rescheduled), cancelled with their tickets, or deleted without any.
 */
const TicketDatesTab = ({ production }: { production: any }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const { setModal } = useModal();
  const { hasRole } = useAuth();
  const { removeTicketPerformance, cancelTicketPerformance } = useTicketProductionMutations();
  const [editing, setEditing] = useState<string | null>(null);
  const { columns, rows } = buildPerformanceGrid(production);
  const canManage = hasRole('manageProducts');
  const canCancel = hasRole('cancelTicket');
  const categoryName = (code: string | null) =>
    production.ticketProduction.categories?.find((category) => category.code === code)?.option?.texts
      ?.title || code;

  const onCancel = (row: PerformanceRow) => {
    let generateDiscount = false;
    setModal(
      <DangerMessage
        onCancelClick={() => setModal('')}
        message={
          <>
            {formatMessage({
              id: 'performance_cancel_confirmation',
              defaultMessage: 'Cancel this date? The tickets of all its categories are cancelled.',
            })}
            <label className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                className="rounded border-border-default"
                onChange={(e) => {
                  generateDiscount = e.target.checked;
                }}
              />
              {formatMessage({
                id: 'generate_discount_codes',
                defaultMessage: 'Generate discount codes for affected users',
              })}
            </label>
          </>
        }
        onOkClick={async () => {
          setModal('');
          try {
            const cancelled = await cancelTicketPerformance(
              production._id,
              row.startsAt,
              generateDiscount,
            );
            toast.success(
              formatMessage(
                { id: 'performance_cancelled', defaultMessage: 'Date cancelled ({count} tickets)' },
                { count: cancelled },
              ),
            );
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
        okText={formatMessage({ id: 'performance_cancel', defaultMessage: 'Cancel date' })}
      />,
    );
  };

  const onRemove = (row: PerformanceRow) =>
    setModal(
      <DangerMessage
        onCancelClick={() => setModal('')}
        message={formatMessage({
          id: 'performance_remove_confirmation',
          defaultMessage:
            'Delete this date? Dates with sold tickets cannot be deleted; cancel them instead.',
        })}
        onOkClick={async () => {
          setModal('');
          try {
            await removeTicketPerformance(production._id, row.startsAt);
            toast.success(formatMessage({ id: 'performance_removed', defaultMessage: 'Date deleted' }));
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
        okText={formatMessage({ id: 'delete', defaultMessage: 'Delete' })}
      />,
    );

  return (
    <div className="space-y-6">
      {rows.length ? (
        <Table className="min-w-full">
          <Table.Row header>
            <Table.Cell>
              {formatMessage({ id: 'event_form_starts_at', defaultMessage: 'Start' })}
            </Table.Cell>
            {columns.map((code) => (
              <Table.Cell key={code ?? ''}>
                {code
                  ? categoryName(code)
                  : formatMessage({ id: 'tickets_sold', defaultMessage: 'Tickets Sold' })}
              </Table.Cell>
            ))}
            <Table.Cell>{formatMessage({ id: 'status', defaultMessage: 'Status' })}</Table.Cell>
            <Table.Cell> </Table.Cell>
          </Table.Row>
          {rows.map((row) => {
            const event = row.products[0]?.event;
            return (
              <Fragment key={row.startsAt}>
                <Table.Row>
                  <Table.Cell>
                    <div className="flex flex-col">
                      <span className="text-text-primary">
                        {formatDateTime(row.startsAt, { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      {event?.location && (
                        <span className="text-xs text-text-muted">{event.location}</span>
                      )}
                    </div>
                  </Table.Cell>
                  {columns.map((code) => (
                    <Table.Cell key={code ?? ''}>
                      <TicketCell product={code ? row.cells[code] : row.products[0]} />
                    </Table.Cell>
                  ))}
                  <Table.Cell>
                    <Badge
                      text={
                        event?.isCanceled
                          ? formatMessage({ id: 'event_status_cancelled', defaultMessage: 'CANCELLED' })
                          : row.products[0]?.status
                      }
                      color={
                        event?.isCanceled
                          ? 'rose'
                          : row.products[0]?.status === 'ACTIVE'
                            ? 'emerald'
                            : 'amber'
                      }
                      square
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-end gap-2">
                      {canManage && (
                        <Button
                          variant="secondary"
                          size="sm"
                          text={formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
                          onClick={() => setEditing(editing === row.startsAt ? null : row.startsAt)}
                        />
                      )}
                      {canCancel && !event?.isCanceled && row.products[0]?.status === 'ACTIVE' && (
                        <Button
                          variant="danger"
                          size="sm"
                          text={formatMessage({
                            id: 'performance_cancel',
                            defaultMessage: 'Cancel date',
                          })}
                          onClick={() => onCancel(row)}
                        />
                      )}
                      {canManage && (
                        <Button
                          variant="danger"
                          size="sm"
                          text={formatMessage({ id: 'delete', defaultMessage: 'Delete' })}
                          onClick={() => onRemove(row)}
                        />
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              </Fragment>
            );
          })}
        </Table>
      ) : (
        <NoData message={formatMessage({ id: 'performances_noun', defaultMessage: 'dates' })} />
      )}
      {canManage &&
        (editing ? (
          <TicketDateForm
            key={editing}
            production={production}
            row={editing === 'new' ? null : rows.find(({ startsAt }) => startsAt === editing) || null}
            columns={columns}
            onDone={() => setEditing(null)}
          />
        ) : (
          <Button
            text={formatMessage({ id: 'performance_add', defaultMessage: 'Add date' })}
            onClick={() => setEditing('new')}
          />
        ))}
    </div>
  );
};

export default TicketDatesTab;
