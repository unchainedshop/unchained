import { useIntl } from 'react-intl';
import type { OnSaleValue, SaleRulesFormValues } from '../../utils/production-form.ts';

export const inputClassName =
  'mt-1 block w-full rounded-md border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-focus-ring disabled:opacity-50';

export const primaryButtonClassName =
  'inline-flex items-center rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50';

export const secondaryButtonClassName =
  'inline-flex items-center rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised disabled:opacity-50';

export const dangerButtonClassName =
  'inline-flex items-center rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50';

/** The message of a failed mutation: the GraphQL error when there is one. */
export const errorMessage = (error) =>
  error?.errors?.[0]?.message ?? error?.graphQLErrors?.[0]?.message ?? error?.message;

export const Field = ({
  label,
  invalid = false,
  className = '',
  ...props
}: { label: string; invalid?: boolean; className?: string } & Record<string, any>) => (
  <label className={`block text-sm font-medium text-text-secondary ${className}`}>
    {label}
    <input
      {...props}
      aria-invalid={invalid}
      className={`${inputClassName}${invalid ? ' border-rose-500' : ''}`}
    />
  </label>
);

export const SectionTitle = ({ children }) => (
  <h3 className="mb-3 text-base font-semibold text-text-primary">{children}</h3>
);

/**
 * The four sale rules. With `inherited` (a performance), unset rules show the rule of the
 * production and "inherit" takes it over again.
 */
export const SaleRulesFields = ({
  values,
  onChange,
  invalid = [],
  inherited = null,
}: {
  values: SaleRulesFormValues;
  onChange: (values: SaleRulesFormValues) => void;
  invalid?: string[];
  inherited?: SaleRulesFormValues | null;
}) => {
  const { formatMessage } = useIntl();
  const set = (key: keyof SaleRulesFormValues) => (e) => onChange({ ...values, [key]: e.target.value });
  const onSaleLabels: Record<OnSaleValue, string> = {
    inherit: inherited
      ? formatMessage({ id: 'sale_rules_inherit', defaultMessage: 'As the production' })
      : formatMessage({ id: 'sale_rules_unset', defaultMessage: 'Not set (on sale)' }),
    open: formatMessage({ id: 'sale_rules_open', defaultMessage: 'On sale' }),
    closed: formatMessage({ id: 'sale_rules_closed', defaultMessage: 'Not on sale' }),
  };
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium text-text-secondary">
        {formatMessage({ id: 'sale_rules_on_sale', defaultMessage: 'Sale' })}
        <select value={values.onSale} onChange={set('onSale')} className={inputClassName}>
          {(['inherit', 'open', 'closed'] as OnSaleValue[]).map((option) => (
            <option key={option} value={option}>
              {onSaleLabels[option]}
            </option>
          ))}
        </select>
      </label>
      <Field
        label={formatMessage({
          id: 'sale_rules_max_per_order',
          defaultMessage: 'Tickets per order (max.)',
        })}
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        value={values.maxPerOrder}
        placeholder={inherited?.maxPerOrder || ''}
        onChange={set('maxPerOrder')}
        invalid={invalid.includes('saleRules.maxPerOrder')}
      />
      <Field
        label={formatMessage({ id: 'sale_rules_sales_start', defaultMessage: 'Sale starts' })}
        type="datetime-local"
        value={values.salesStart}
        onChange={set('salesStart')}
        invalid={invalid.includes('saleRules.salesStart')}
      />
      <Field
        label={formatMessage({ id: 'sale_rules_sales_end', defaultMessage: 'Sale ends' })}
        type="datetime-local"
        value={values.salesEnd}
        onChange={set('salesEnd')}
        invalid={invalid.includes('saleRules.salesEnd')}
      />
      {inherited && (
        <p className="text-xs text-text-muted sm:col-span-2">
          {formatMessage({
            id: 'sale_rules_inherited_hint',
            defaultMessage: 'Empty rules are taken from the production.',
          })}
        </p>
      )}
    </div>
  );
};

export const InvalidFieldsAlert = ({ fields }: { fields: string[] }) => {
  const { formatMessage } = useIntl();
  if (!fields.length) return null;
  return (
    <p role="alert" className="text-sm text-rose-600">
      {formatMessage(
        {
          id: 'production_form_invalid',
          defaultMessage:
            'Check the marked fields. Codes use lowercase letters, digits, - and _; numbers are whole numbers of 0 or more, prices like 45.50.',
        },
        { count: fields.length },
      )}
    </p>
  );
};
