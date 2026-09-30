import Link from 'next/link';
import { Fragment, useState } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import { useModal, DangerMessage } from '@unchainedshop/admin-ui/modal';
import { Badge } from '@unchainedshop/admin-ui/ui';
import useTicketProductionMutations from '../../hooks/useTicketProductionMutations.ts';
import { buildPerformanceGrid, type PerformanceRow } from '../../utils/production-grid.ts';
import type { ShopDefaults } from '../../utils/production-form.ts';
import { generateUniqueId, useFormatDateTime, useFormatPrice } from '../../utils/misc.ts';
import TicketPerformanceForm from './TicketPerformanceForm.tsx';
import {
  SectionTitle,
  dangerButtonClassName,
  errorMessage,
  primaryButtonClassName,
  secondaryButtonClassName,
} from './fields.tsx';

// Sold / supply and price of the tickets of one category in one date, linking to its attendees.
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
 * The dates of a production: a row per start, a column per ticket category. Dates are added,
 * changed (rescheduled), cancelled with all their tickets, or removed while they have none.
 */
const TicketPerformanceGrid = ({
  production,
  shop,
  canCancel,
}: {
  production: any;
  shop: ShopDefaults;
  canCancel: boolean;
}) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const { setModal } = useModal();
  const { removeTicketPerformance, cancelTicketPerformance } = useTicketProductionMutations();
  const [editing, setEditing] = useState<string | null>(null);
  const { columns, rows } = buildPerformanceGrid(production);
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
          defaultMessage: 'Remove this date? Dates with tickets cannot be removed, cancel them instead.',
        })}
        onOkClick={async () => {
          setModal('');
          try {
            await removeTicketPerformance(production._id, row.startsAt);
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
        okText={formatMessage({ id: 'remove', defaultMessage: 'Remove' })}
      />,
    );

  return (
    <section className="rounded-md border border-border-default bg-surface p-5">
      <SectionTitle>{formatMessage({ id: 'performances', defaultMessage: 'Dates' })}</SectionTitle>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-text-muted">
              <th className="py-2 pr-4 font-medium">
                {formatMessage({ id: 'event_form_starts_at', defaultMessage: 'Start' })}
              </th>
              {columns.map((code) => (
                <th key={code ?? ''} className="py-2 pr-4 font-medium">
                  {code
                    ? categoryName(code)
                    : formatMessage({ id: 'tickets_sold', defaultMessage: 'Tickets Sold' })}
                </th>
              ))}
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const event = row.products[0]?.event;
              return (
                <Fragment key={row.startsAt}>
                  <tr className="border-t border-border-default align-top">
                    <td className="py-2 pr-4">
                      <div className="text-text-primary">
                        {formatDateTime(row.startsAt, { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                      {event?.location && (
                        <div className="text-xs text-text-muted">{event.location}</div>
                      )}
                      {event?.isCanceled && (
                        <Badge
                          text={formatMessage({
                            id: 'event_status_cancelled',
                            defaultMessage: 'CANCELLED',
                          })}
                          color="rose"
                          square
                        />
                      )}
                    </td>
                    {columns.map((code) => (
                      <td key={code ?? ''} className="py-2 pr-4">
                        <TicketCell product={code ? row.cells[code] : row.products[0]} />
                      </td>
                    ))}
                    <td className="py-2">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          className={secondaryButtonClassName}
                          onClick={() => setEditing(editing === row.startsAt ? null : row.startsAt)}
                        >
                          {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
                        </button>
                        {canCancel && !event?.isCanceled && (
                          <button
                            type="button"
                            className={dangerButtonClassName}
                            onClick={() => onCancel(row)}
                          >
                            {formatMessage({ id: 'performance_cancel', defaultMessage: 'Cancel date' })}
                          </button>
                        )}
                        <button
                          type="button"
                          className={dangerButtonClassName}
                          onClick={() => onRemove(row)}
                        >
                          {formatMessage({ id: 'remove', defaultMessage: 'Remove' })}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editing === row.startsAt && (
                    <tr>
                      <td colSpan={columns.length + 2} className="pb-4">
                        <TicketPerformanceForm
                          production={production}
                          row={row}
                          columns={columns}
                          shop={shop}
                          onDone={() => setEditing(null)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        {editing === 'new' ? (
          <TicketPerformanceForm
            production={production}
            row={null}
            columns={columns}
            shop={shop}
            onDone={() => setEditing(null)}
          />
        ) : (
          <button type="button" className={primaryButtonClassName} onClick={() => setEditing('new')}>
            {formatMessage({ id: 'performance_add', defaultMessage: 'Add date' })}
          </button>
        )}
      </div>
    </section>
  );
};

export default TicketPerformanceGrid;
