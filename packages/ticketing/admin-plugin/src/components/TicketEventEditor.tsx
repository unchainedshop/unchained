import { useIntl } from 'react-intl';
import { Button, FormWrapper } from '@unchainedshop/admin-ui/ui';
import { Form, SubmitButton, TextField } from '@unchainedshop/admin-ui/form';
import { useForm } from '@unchainedshop/admin-ui/hooks';
import useUpdateTicketEvent from '../hooks/useUpdateTicketEvent.ts';
import {
  getTicketEventFormValues,
  toUpdateTicketEventInput,
  type TicketEventFormValues,
} from '../utils/event-form.ts';
import { fromTicketSaleRules, toTicketSaleRulesInput } from '../utils/production-form.ts';
import { DateTimeField, FormFooter, SaleRulesFields, errorMessage } from './production/fields.tsx';

const DETAIL_KEYS: (keyof TicketEventFormValues)[] = [
  'startsAt',
  'location',
  'category',
  'durationMinutes',
  'doorsOpenMinutesBefore',
];

/**
 * Edits the event details and sale rules stored in the product meta (updateTicketEvent). A date of
 * a production takes its start and category from the production and its empty details and sale
 * rules as well; only the details changed here are sent. Times are in the browser's time zone.
 */
const TicketEventEditor = ({ product, production = null, onDone }) => {
  const { formatMessage } = useIntl();
  const { updateTicketEvent } = useUpdateTicketEvent();
  const initial = getTicketEventFormValues(product);
  const invalid = formatMessage({ id: 'invalid_value', defaultMessage: 'Enter a valid value' });

  const form = useForm({
    submit: async (values) => {
      const details = Object.fromEntries(
        DETAIL_KEYS.map((key) => [
          key,
          values[key] === null || values[key] === undefined ? '' : String(values[key]),
        ]),
      ) as unknown as TicketEventFormValues;
      const result = toUpdateTicketEventInput(details);
      const rules = toTicketSaleRulesInput(values);
      const errors = [
        ...('errors' in result ? result.errors : []),
        ...('errors' in rules ? rules.errors : []),
      ];
      if ('errors' in result || 'errors' in rules) {
        errors.forEach((name) => form.api.setFieldError(name, invalid));
        return { success: false, error: { message: '' } };
      }
      // The start and category of a date of a production are changed through the production
      const { startsAt, category, ...changes } = result.input;
      const event = production
        ? {
            ...Object.fromEntries(
              Object.entries(changes).filter(([key]) => details[key] !== initial[key]),
            ),
            saleRules: rules.input,
          }
        : { ...changes, startsAt, category, saleRules: rules.input };
      try {
        await updateTicketEvent({ productId: product._id, event });
        return { success: true };
      } catch (error) {
        return { success: false, error: { message: errorMessage(error) } };
      }
    },
    getSubmitErrorMessage: (error) => error?.message,
    onSubmitSuccess: () => {
      onDone?.();
      return true;
    },
    successMessage: formatMessage({ id: 'event_form_saved', defaultMessage: 'Event details saved' }),
    initialValues: { ...initial, ...fromTicketSaleRules(product?.event?.ownSaleRules) },
  });

  return (
    <FormWrapper>
      <Form form={form}>
        <div className="space-y-6 p-5 pb-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <DateTimeField
              name="startsAt"
              label={formatMessage({ id: 'event_form_starts_at', defaultMessage: 'Start' })}
              disabled={Boolean(production)}
            />
            <TextField
              name="location"
              label={formatMessage({ id: 'event_form_location', defaultMessage: 'Location' })}
            />
            <TextField
              name="category"
              label={formatMessage({ id: 'event_form_category', defaultMessage: 'Category' })}
              disabled={Boolean(production)}
            />
            <TextField
              name="durationMinutes"
              type="number"
              label={formatMessage({ id: 'event_form_duration', defaultMessage: 'Duration (minutes)' })}
            />
            <TextField
              name="doorsOpenMinutesBefore"
              type="number"
              label={formatMessage({
                id: 'event_form_doors_open',
                defaultMessage: 'Doors open (minutes before the start)',
              })}
            />
          </div>
          <div>
            <h3 className="mb-3 text-base font-medium text-text-primary">
              {formatMessage({ id: 'sale_rules', defaultMessage: 'Sale rules' })}
            </h3>
            <SaleRulesFields
              inherited={production ? fromTicketSaleRules(production.ticketProduction?.saleRules) : null}
            />
          </div>
          {production && (
            <p className="text-xs text-text-muted">
              {formatMessage({
                id: 'event_form_production_hint',
                defaultMessage:
                  'Start and category are changed in the production. Details changed here are no longer taken over from the production.',
              })}
            </p>
          )}
        </div>
        <FormFooter>
          {onDone && (
            <Button
              variant="secondary"
              text={formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
              onClick={onDone}
            />
          )}
          <SubmitButton label={formatMessage({ id: 'save', defaultMessage: 'Save' })} />
        </FormFooter>
      </Form>
    </FormWrapper>
  );
};

export default TicketEventEditor;
