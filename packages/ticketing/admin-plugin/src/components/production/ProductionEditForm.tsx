import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import useTicketProductionMutations from '../../hooks/useTicketProductionMutations.ts';
import {
  productionEditFormValues,
  toUpdateTicketProductionInput,
  type ProductionEditFormValues,
  type ShopDefaults,
} from '../../utils/production-form.ts';
import {
  Field,
  InvalidFieldsAlert,
  SaleRulesFields,
  SectionTitle,
  errorMessage,
  inputClassName,
  primaryButtonClassName,
} from './fields.tsx';

/**
 * Texts (in the shop language), tags, details and sale rules of a production. Texts, tags and the
 * details a date does not override are taken over by all dates when saved.
 */
const ProductionEditForm = ({ production, shop }: { production: any; shop: ShopDefaults }) => {
  const { formatMessage } = useIntl();
  const { updateTicketProduction } = useTicketProductionMutations();
  const [values, setValues] = useState<ProductionEditFormValues>(() =>
    productionEditFormValues(production),
  );
  const [invalid, setInvalid] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // The stored production wins after a save or an update elsewhere
  useEffect(() => setValues(productionEditFormValues(production)), [production]);

  const set = (key: keyof ProductionEditFormValues) => (e) =>
    setValues((current) => ({ ...current, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const result = toUpdateTicketProductionInput(values, shop);
    if ('errors' in result) {
      setInvalid(result.errors);
      return;
    }
    setInvalid([]);
    setSaving(true);
    try {
      await updateTicketProduction(production._id, result.input);
      toast.success(
        formatMessage({ id: 'production_saved', defaultMessage: 'Production and dates saved' }),
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-md border border-border-default bg-surface p-5"
      noValidate
    >
      <div>
        <SectionTitle>
          {formatMessage(
            { id: 'production_texts_locale', defaultMessage: 'Production ({locale})' },
            { locale: shop.locale },
          )}
        </SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={formatMessage({ id: 'production_title', defaultMessage: 'Title' })}
            value={values.title}
            onChange={set('title')}
            invalid={invalid.includes('title')}
          />
          <Field
            label={formatMessage({ id: 'production_subtitle', defaultMessage: 'Subtitle' })}
            value={values.subtitle}
            onChange={set('subtitle')}
          />
          <label className="block text-sm font-medium text-text-secondary sm:col-span-2">
            {formatMessage({ id: 'production_description', defaultMessage: 'Description' })}
            <textarea
              rows={5}
              value={values.description}
              onChange={set('description')}
              className={inputClassName}
            />
          </label>
          <Field
            label={formatMessage({
              id: 'production_tags',
              defaultMessage: 'Tags (comma separated, e.g. the organizer)',
            })}
            value={values.tags}
            onChange={set('tags')}
          />
          <Field
            label={formatMessage({ id: 'event_form_location', defaultMessage: 'Location' })}
            value={values.location}
            onChange={set('location')}
          />
          <Field
            label={formatMessage({ id: 'event_form_duration', defaultMessage: 'Duration (minutes)' })}
            type="number"
            min={0}
            step={1}
            value={values.durationMinutes}
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
            onChange={set('doorsOpenMinutesBefore')}
            invalid={invalid.includes('doorsOpenMinutesBefore')}
          />
        </div>
      </div>
      <div>
        <SectionTitle>{formatMessage({ id: 'sale_rules', defaultMessage: 'Sale rules' })}</SectionTitle>
        <SaleRulesFields
          values={values.saleRules}
          onChange={(saleRules) => setValues((current) => ({ ...current, saleRules }))}
          invalid={invalid}
        />
      </div>
      <InvalidFieldsAlert fields={invalid} />
      <button type="submit" disabled={saving} className={primaryButtonClassName}>
        {formatMessage({ id: 'production_save', defaultMessage: 'Save production' })}
      </button>
    </form>
  );
};

export default ProductionEditForm;
