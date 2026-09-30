import { useIntl } from 'react-intl';
import { FieldWrapper, SelectField, TextField } from '@unchainedshop/admin-ui/form';
import { useField } from '@unchainedshop/admin-ui/hooks';
import type { SaleRulesFormValues } from '../../utils/production-form.ts';

/** The message of a failed mutation: the GraphQL error when there is one. */
export const errorMessage = (error) =>
  error?.errors?.[0]?.message ?? error?.graphQLErrors?.[0]?.message ?? error?.message;

/** The footer of an admin-ui form card, holding its buttons. */
export const FormFooter = ({ children }) => (
  <div className="flex justify-end gap-3 border-t border-t-border-subtle bg-surface-subtle p-5">
    {children}
  </div>
);

/** A date and time in the browser's time zone, styled like the admin-ui date field. */
export const DateTimeField = ({ className = '', ...props }: Record<string, any>) => {
  const field = useField(props);
  return (
    <FieldWrapper {...field} className={props.containerClassName}>
      <input
        type="datetime-local"
        id={field.name}
        name={field.name}
        disabled={field.disabled}
        className={[
          'relative mt-0 block w-full appearance-none rounded-md border-1 border-border-default px-4 py-2.5 text-sm text-text-primary shadow-xs placeholder-slate-400 focus:z-10 focus:outline-hidden focus:ring-2 focus:ring-focus-ring dark:bg-slate-900',
          className,
          field.error ? 'border-rose-700 placeholder:text-rose-300' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onChange={field.onChange}
        onBlur={field.onBlur}
        value={field.value || ''}
        autoComplete="off"
      />
    </FieldWrapper>
  );
};

/**
 * The four sale rules as form fields (onSale, maxPerOrder, salesStart, salesEnd). With
 * `inherited` (a date of a production) the production's rules are shown as help.
 */
export const SaleRulesFields = ({ inherited = null }: { inherited?: SaleRulesFormValues | null }) => {
  const { formatMessage } = useIntl();
  const onSaleOptions = {
    inherit: inherited
      ? formatMessage({ id: 'sale_rules_inherit', defaultMessage: 'As the production' })
      : formatMessage({ id: 'sale_rules_unset', defaultMessage: 'Not restricted' }),
    open: formatMessage({ id: 'sale_rules_open', defaultMessage: 'On sale' }),
    closed: formatMessage({ id: 'sale_rules_closed', defaultMessage: 'Not on sale' }),
  };
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField
        name="onSale"
        label={formatMessage({ id: 'sale_rules_on_sale', defaultMessage: 'Sale' })}
        options={onSaleOptions}
      />
      <TextField
        name="maxPerOrder"
        type="number"
        label={formatMessage({
          id: 'sale_rules_max_per_order',
          defaultMessage: 'Tickets per order (max.)',
        })}
        placeholder={inherited?.maxPerOrder || ''}
      />
      <DateTimeField
        name="salesStart"
        label={formatMessage({ id: 'sale_rules_sales_start', defaultMessage: 'Sale starts' })}
      />
      <DateTimeField
        name="salesEnd"
        label={formatMessage({ id: 'sale_rules_sales_end', defaultMessage: 'Sale ends' })}
      />
      {inherited && (
        <p className="text-xs text-text-muted sm:col-span-2">
          {formatMessage(
            {
              id: 'sale_rules_inherited_summary',
              defaultMessage:
                'Empty rules are taken from the production: {onSale}{maxPerOrder, select, none {} other {, at most {maxPerOrder} per order}}{salesStart, select, none {} other {, from {salesStart}}}{salesEnd, select, none {} other {, until {salesEnd}}}.',
            },
            {
              onSale:
                !inherited.onSale || inherited.onSale === 'inherit'
                  ? formatMessage({ id: 'sale_rules_unset', defaultMessage: 'Not restricted' })
                  : onSaleOptions[inherited.onSale],
              maxPerOrder: inherited.maxPerOrder || 'none',
              salesStart: inherited.salesStart?.replace('T', ' ') || 'none',
              salesEnd: inherited.salesEnd?.replace('T', ' ') || 'none',
            },
          )}
        </p>
      )}
    </div>
  );
};
