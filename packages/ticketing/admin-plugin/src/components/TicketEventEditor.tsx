import { useState } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import useUpdateTicketEvent from '../hooks/useUpdateTicketEvent.ts';
import {
  fromTicketSaleRules,
  toTicketSaleRulesInput,
  type SaleRulesFormValues,
} from '../utils/production-form.ts';
import { SaleRulesFields, errorMessage } from './production/fields.tsx';
import {
  getTicketEventFormValues,
  toUpdateTicketEventInput,
  type TicketEventFormValues,
} from '../utils/event-form.ts';

const inputClassName =
  'mt-1 block w-full rounded-md border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-focus-ring';

/**
 * Edits the event details and sale rules stored in the product meta (updateTicketEvent): start,
 * location, category, duration, when doors open and the sale rules. A date of a production takes
 * its start and category from the production, and its empty sale rules. Times are in the
 * browser's time zone.
 */
const TicketEventEditor = ({ product, production = null, onDone }) => {
  const { formatMessage } = useIntl();
  const { updateTicketEvent } = useUpdateTicketEvent();
  const [initial] = useState<TicketEventFormValues>(() => getTicketEventFormValues(product));
  const [values, setValues] = useState<TicketEventFormValues>(initial);
  const [saleRules, setSaleRules] = useState<SaleRulesFormValues>(() =>
    fromTicketSaleRules(product?.event?.ownSaleRules),
  );
  const [invalid, setInvalid] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const labels: Record<keyof TicketEventFormValues, string> = {
    startsAt: formatMessage({ id: 'event_form_starts_at', defaultMessage: 'Start' }),
    location: formatMessage({ id: 'event_form_location', defaultMessage: 'Location' }),
    category: formatMessage({ id: 'event_form_category', defaultMessage: 'Category' }),
    durationMinutes: formatMessage({
      id: 'event_form_duration',
      defaultMessage: 'Duration (minutes)',
    }),
    doorsOpenMinutesBefore: formatMessage({
      id: 'event_form_doors_open',
      defaultMessage: 'Doors open (minutes before the start)',
    }),
  };

  const field = (key: keyof TicketEventFormValues, props: Record<string, unknown> = {}) => (
    <label className="block text-sm font-medium text-text-secondary">
      {labels[key]}
      <input
        {...props}
        name={key}
        value={values[key]}
        onChange={(e) => setValues((current) => ({ ...current, [key]: e.target.value }))}
        aria-invalid={invalid.includes(key)}
        className={`${inputClassName}${invalid.includes(key) ? ' border-rose-500' : ''}`}
      />
    </label>
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    const result = toUpdateTicketEventInput(values);
    const rules = toTicketSaleRulesInput(saleRules);
    if ('errors' in result || 'errors' in rules) {
      setInvalid([
        ...('errors' in result ? result.errors : []),
        ...('errors' in rules ? rules.errors : []),
      ]);
      return;
    }
    // The start and category of a date of a production are changed through the production, and
    // only changed details are sent: a detail set here is no longer taken over from the production.
    const { startsAt, category, ...details } = result.input;
    const event = production
      ? {
          ...Object.fromEntries(Object.entries(details).filter(([key]) => values[key] !== initial[key])),
          saleRules: rules.input,
        }
      : { ...details, startsAt, category, saleRules: rules.input };
    setInvalid([]);
    setSaving(true);
    try {
      await updateTicketEvent({ productId: product._id, event });
      toast.success(formatMessage({ id: 'event_form_saved', defaultMessage: 'Event details saved' }));
      onDone?.();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
      {field('startsAt', { type: 'datetime-local', disabled: Boolean(production) })}
      {field('location', { type: 'text' })}
      {field('category', { type: 'text', disabled: Boolean(production) })}
      {field('durationMinutes', { type: 'number', min: 0, step: 1, inputMode: 'numeric' })}
      {field('doorsOpenMinutesBefore', { type: 'number', min: 0, step: 1, inputMode: 'numeric' })}
      <div className="sm:col-span-2">
        <SaleRulesFields
          values={saleRules}
          onChange={setSaleRules}
          invalid={invalid}
          inherited={production ? fromTicketSaleRules(production.ticketProduction?.saleRules) : null}
        />
      </div>
      {invalid.length > 0 && (
        <p role="alert" className="text-sm text-rose-600 sm:col-span-2">
          {formatMessage(
            {
              id: 'event_form_invalid',
              defaultMessage: 'Check these fields: {fields}. Minutes are whole numbers of 0 or more.',
            },
            { fields: invalid.map((key) => labels[key]).join(', ') },
          )}
        </p>
      )}
      <p className="text-xs text-text-muted sm:col-span-2">
        {formatMessage({
          id: 'event_form_hint',
          defaultMessage:
            'An empty field removes the detail. Details changed here are no longer taken over from the production.',
        })}
      </p>
      <div className="flex gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
        >
          {formatMessage({ id: 'event_form_save', defaultMessage: 'Save event details' })}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="inline-flex items-center rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised"
          >
            {formatMessage({ id: 'event_form_cancel', defaultMessage: 'Cancel' })}
          </button>
        )}
      </div>
    </form>
  );
};

export default TicketEventEditor;
