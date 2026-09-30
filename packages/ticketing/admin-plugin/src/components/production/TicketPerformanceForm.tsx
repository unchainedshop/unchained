import { useState } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import useTicketProductionMutations from '../../hooks/useTicketProductionMutations.ts';
import {
  fromTicketSaleRules,
  performanceFormValues,
  toTicketPerformanceInput,
  type PerformanceEditFormValues,
  type ShopDefaults,
} from '../../utils/production-form.ts';
import type { PerformanceRow } from '../../utils/production-grid.ts';
import {
  Field,
  InvalidFieldsAlert,
  SaleRulesFields,
  errorMessage,
  primaryButtonClassName,
  secondaryButtonClassName,
} from './fields.tsx';

/**
 * Adds a date (without row) or changes one: a new start reschedules it, empty details and rules
 * are taken from the production, supply and price per category apply to this date only.
 */
const TicketPerformanceForm = ({
  production,
  row,
  columns,
  shop,
  onDone,
}: {
  production: any;
  row: PerformanceRow | null;
  columns: (string | null)[];
  shop: ShopDefaults;
  onDone: () => void;
}) => {
  const { formatMessage } = useIntl();
  const { addTicketPerformance, updateTicketPerformance } = useTicketProductionMutations();
  const [initial] = useState(() => performanceFormValues(row, columns));
  const [values, setValues] = useState<PerformanceEditFormValues>(initial);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const details = production.ticketProduction;
  const sold = row ? row.products.reduce((sum, product) => sum + (product?.tokensCount || 0), 0) : 0;

  const set = (key: keyof PerformanceEditFormValues) => (e) =>
    setValues((current) => ({ ...current, [key]: e.target.value }));
  const setTicket = (code: string, key: 'supply' | 'price') => (e) =>
    setValues((current) => ({
      ...current,
      tickets: { ...current.tickets, [code]: { ...current.tickets[code], [key]: e.target.value } },
    }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const result = toTicketPerformanceInput(values, row ? initial : null, shop);
    if ('errors' in result) {
      setInvalid(result.errors);
      return;
    }
    const rescheduled = row && result.input.startsAt;
    if (
      rescheduled &&
      sold > 0 &&
      !window.confirm(
        formatMessage(
          {
            id: 'performance_reschedule_sold',
            defaultMessage:
              '{sold} tickets are sold for this date. They stay valid for the new start; inform the buyers. Continue?',
          },
          { sold },
        ),
      )
    ) {
      return;
    }
    setInvalid([]);
    setSaving(true);
    try {
      if (row) await updateTicketPerformance(production._id, row.startsAt, result.input);
      else await addTicketPerformance(production._id, result.input);
      toast.success(formatMessage({ id: 'performance_saved', defaultMessage: 'Date saved' }));
      onDone();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const placeholder = (value) => (value === null || value === undefined ? '' : String(value));

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-md border border-border-default bg-surface-raised p-4"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-4">
        <Field
          label={formatMessage({ id: 'event_form_starts_at', defaultMessage: 'Start' })}
          type="datetime-local"
          value={values.startsAt}
          onChange={set('startsAt')}
          invalid={invalid.includes('startsAt')}
        />
        <Field
          label={formatMessage({ id: 'event_form_location', defaultMessage: 'Location' })}
          value={values.location}
          placeholder={placeholder(details.location)}
          onChange={set('location')}
        />
        <Field
          label={formatMessage({ id: 'event_form_duration', defaultMessage: 'Duration (minutes)' })}
          type="number"
          min={0}
          step={1}
          value={values.durationMinutes}
          placeholder={placeholder(details.durationMinutes)}
          onChange={set('durationMinutes')}
          invalid={invalid.includes('durationMinutes')}
        />
        <Field
          label={formatMessage({
            id: 'event_form_doors_open',
            defaultMessage: 'Doors open (minutes before the start)',
          })}
          type="number"
          min={0}
          step={1}
          value={values.doorsOpenMinutesBefore}
          placeholder={placeholder(details.doorsOpenMinutesBefore)}
          onChange={set('doorsOpenMinutesBefore')}
          invalid={invalid.includes('doorsOpenMinutesBefore')}
        />
      </div>
      {columns.map((code) => {
        const key = code ?? '';
        const category = details.categories?.find((entry) => entry.code === code);
        return (
          <div key={key} className="grid gap-4 sm:grid-cols-4">
            <div className="self-end pb-2 text-sm font-medium text-text-primary">
              {category?.option?.texts?.title ||
                code ||
                formatMessage({ id: 'tickets', defaultMessage: 'Tickets' })}
            </div>
            <Field
              label={formatMessage({ id: 'category_capacity', defaultMessage: 'Capacity' })}
              type="number"
              min={0}
              step={1}
              value={values.tickets[key]?.supply ?? ''}
              placeholder={placeholder(category?.capacity)}
              onChange={setTicket(key, 'supply')}
              invalid={invalid.includes(`tickets.${key}.supply`)}
            />
            <Field
              label={formatMessage(
                { id: 'category_price', defaultMessage: 'Price ({currency})' },
                { currency: shop.currencyCode },
              )}
              inputMode="decimal"
              value={values.tickets[key]?.price ?? ''}
              onChange={setTicket(key, 'price')}
              invalid={invalid.includes(`tickets.${key}.price`)}
            />
          </div>
        );
      })}
      <SaleRulesFields
        values={values.saleRules}
        onChange={(saleRules) => setValues((current) => ({ ...current, saleRules }))}
        invalid={invalid}
        inherited={fromTicketSaleRules(details.saleRules)}
      />
      <InvalidFieldsAlert fields={invalid} />
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className={primaryButtonClassName}>
          {row
            ? formatMessage({ id: 'performance_save', defaultMessage: 'Save date' })
            : formatMessage({ id: 'performance_add', defaultMessage: 'Add date' })}
        </button>
        <button type="button" className={secondaryButtonClassName} onClick={onDone}>
          {formatMessage({ id: 'event_form_cancel', defaultMessage: 'Cancel' })}
        </button>
      </div>
    </form>
  );
};

export default TicketPerformanceForm;
