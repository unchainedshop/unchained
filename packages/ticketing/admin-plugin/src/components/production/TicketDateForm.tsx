import { useIntl } from 'react-intl';
import { Button, FormWrapper } from '@unchainedshop/admin-ui/ui';
import { Form, SubmitButton, TextField } from '@unchainedshop/admin-ui/form';
import { useForm } from '@unchainedshop/admin-ui/hooks';
import useShopDefaults from '../../hooks/useShopDefaults.ts';
import useTicketProductionMutations from '../../hooks/useTicketProductionMutations.ts';
import {
  fromTicketSaleRules,
  performanceFormValues,
  toTicketPerformanceInput,
  type PerformanceEditFormValues,
} from '../../utils/production-form.ts';
import type { PerformanceRow } from '../../utils/production-grid.ts';
import { DateTimeField, FormFooter, SaleRulesFields, errorMessage } from './fields.tsx';

// The admin-ui form keeps flat fields; the tickets of a category are supply_<n> and price_<n>.
const toFormValues = (values: PerformanceEditFormValues, columns: (string | null)[]) => ({
  startsAt: values.startsAt,
  location: values.location,
  durationMinutes: values.durationMinutes,
  doorsOpenMinutesBefore: values.doorsOpenMinutesBefore,
  ...values.saleRules,
  ...Object.fromEntries(
    columns.flatMap((code, index) => [
      [`supply_${index}`, values.tickets[code ?? '']?.supply ?? ''],
      [`price_${index}`, values.tickets[code ?? '']?.price ?? ''],
    ]),
  ),
});

const fromFormValues = (values, columns: (string | null)[]): PerformanceEditFormValues => {
  const text = (value) => (value === null || value === undefined ? '' : String(value));
  return {
    startsAt: text(values.startsAt),
    location: text(values.location),
    durationMinutes: text(values.durationMinutes),
    doorsOpenMinutesBefore: text(values.doorsOpenMinutesBefore),
    saleRules: {
      onSale: values.onSale || 'inherit',
      salesStart: text(values.salesStart),
      salesEnd: text(values.salesEnd),
      maxPerOrder: text(values.maxPerOrder),
    },
    tickets: Object.fromEntries(
      columns.map((code, index) => [
        code ?? '',
        { supply: text(values[`supply_${index}`]), price: text(values[`price_${index}`]) },
      ]),
    ),
  };
};

/**
 * Adds a date (without row) or changes one: a new start reschedules it, empty details and sale
 * rules are taken from the production, capacity and price per category apply to this date only.
 */
const TicketDateForm = ({
  production,
  row,
  columns,
  onDone,
}: {
  production: any;
  row: PerformanceRow | null;
  columns: (string | null)[];
  onDone: () => void;
}) => {
  const { formatMessage } = useIntl();
  const shop = useShopDefaults();
  const { addTicketPerformance, updateTicketPerformance } = useTicketProductionMutations();
  const details = production.ticketProduction;
  const initial = performanceFormValues(row, columns);
  const invalid = formatMessage({ id: 'invalid_value', defaultMessage: 'Enter a valid value' });
  const sold = row ? row.products.reduce((sum, product) => sum + (product?.tokensCount || 0), 0) : 0;
  const categoryName = (code: string | null) =>
    details.categories?.find((category) => category.code === code)?.option?.texts?.title || code;

  const form = useForm({
    submit: async (values) => {
      const result = toTicketPerformanceInput(
        fromFormValues(values, columns),
        row ? initial : null,
        shop,
      );
      if ('errors' in result) {
        result.errors.forEach((name) => {
          const [, code, key] = name.match(/^tickets\.(.*)\.(supply|price)$/) || [];
          const field = key ? `${key}_${columns.indexOf(code || null)}` : name;
          form.api.setFieldError(field, invalid);
        });
        return { success: false, error: { message: '' } };
      }
      if (
        row &&
        result.input.startsAt &&
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
        return { success: false, error: { message: '' } };
      }
      try {
        if (row) await updateTicketPerformance(production._id, row.startsAt, result.input);
        else await addTicketPerformance(production._id, result.input);
        return { success: true };
      } catch (error) {
        return { success: false, error: { message: errorMessage(error) } };
      }
    },
    getSubmitErrorMessage: (error) => error?.message,
    onSubmitSuccess: () => {
      onDone();
      return true;
    },
    successMessage: row
      ? formatMessage({ id: 'performance_saved', defaultMessage: 'Date saved' })
      : formatMessage({ id: 'performance_added', defaultMessage: 'Date added' }),
    initialValues: toFormValues(initial, columns),
  });

  const placeholder = (value) => (value === null || value === undefined ? '' : String(value));

  return (
    <FormWrapper>
      <Form form={form}>
        <div className="space-y-6 p-5 pb-7">
          <h3 className="text-base font-medium text-text-primary">
            {row
              ? formatMessage({ id: 'performance_edit_title', defaultMessage: 'Edit date' })
              : formatMessage({ id: 'performance_add', defaultMessage: 'Add date' })}
          </h3>
          <div className="grid gap-4 sm:grid-cols-4">
            <DateTimeField
              name="startsAt"
              label={formatMessage({ id: 'event_form_starts_at', defaultMessage: 'Start' })}
              required
            />
            <TextField
              name="location"
              label={formatMessage({ id: 'event_form_location', defaultMessage: 'Location' })}
              placeholder={placeholder(details.location)}
            />
            <TextField
              name="durationMinutes"
              type="number"
              label={formatMessage({ id: 'event_form_duration', defaultMessage: 'Duration (minutes)' })}
              placeholder={placeholder(details.durationMinutes)}
            />
            <TextField
              name="doorsOpenMinutesBefore"
              type="number"
              label={formatMessage({
                id: 'event_form_doors_open',
                defaultMessage: 'Doors open (minutes before the start)',
              })}
              placeholder={placeholder(details.doorsOpenMinutesBefore)}
            />
          </div>
          <div className="space-y-3">
            {columns.map((code, index) => {
              const category = details.categories?.find((entry) => entry.code === code);
              return (
                <div key={code ?? ''} className="grid items-end gap-4 sm:grid-cols-4">
                  <div className="pb-3 text-sm font-medium text-text-primary">
                    {categoryName(code) || formatMessage({ id: 'tickets', defaultMessage: 'Tickets' })}
                  </div>
                  <TextField
                    name={`supply_${index}`}
                    type="number"
                    label={formatMessage({ id: 'category_capacity', defaultMessage: 'Capacity' })}
                    placeholder={placeholder(category?.capacity)}
                  />
                  <TextField
                    name={`price_${index}`}
                    label={formatMessage(
                      { id: 'category_price', defaultMessage: 'Price ({currency})' },
                      { currency: shop.currencyCode },
                    )}
                  />
                </div>
              );
            })}
          </div>
          <div>
            <h3 className="mb-3 text-base font-medium text-text-primary">
              {formatMessage({ id: 'sale_rules', defaultMessage: 'Sale rules' })}
            </h3>
            <SaleRulesFields inherited={fromTicketSaleRules(details.saleRules)} />
          </div>
        </div>
        <FormFooter>
          <Button
            variant="secondary"
            text={formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
            onClick={onDone}
          />
          <SubmitButton
            label={
              row
                ? formatMessage({ id: 'save', defaultMessage: 'Save' })
                : formatMessage({ id: 'performance_add', defaultMessage: 'Add date' })
            }
          />
        </FormFooter>
      </Form>
    </FormWrapper>
  );
};

export default TicketDateForm;
