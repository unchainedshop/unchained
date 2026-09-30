import { useState } from 'react';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { PageHeader } from '@unchainedshop/admin-ui/ui';
import useShopDefaults from '../hooks/useShopDefaults.ts';
import useTicketProductionMutations from '../hooks/useTicketProductionMutations.ts';
import {
  emptyProductionFormValues,
  toCreateTicketProductionInput,
  type CategoryFormValues,
  type PerformanceFormValues,
  type ProductionFormValues,
} from '../utils/production-form.ts';
import { generateUniqueId } from '../utils/misc.ts';
import {
  Field,
  InvalidFieldsAlert,
  SaleRulesFields,
  SectionTitle,
  errorMessage,
  primaryButtonClassName,
  secondaryButtonClassName,
} from '../components/production/fields.tsx';

const emptyCategory = (): CategoryFormValues => ({ code: '', name: '', capacity: '', price: '' });
const emptyPerformance = (): PerformanceFormValues => ({ startsAt: '', supply: '', price: '' });

/**
 * A new ticket production in one form: texts, details, sale rules, ticket categories and the
 * first dates. Times are in the browser's time zone, prices in the shop currency.
 */
const TicketProductionCreatePage = () => {
  const { formatMessage } = useIntl();
  const { push } = useRouter();
  const shop = useShopDefaults();
  const { createTicketProduction } = useTicketProductionMutations();
  const [values, setValues] = useState<ProductionFormValues>(emptyProductionFormValues);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof ProductionFormValues) => (e) =>
    setValues((current) => ({ ...current, [key]: e.target.value }));
  const setRow =
    <K extends 'categories' | 'performances'>(list: K, index: number, key: string) =>
    (e) =>
      setValues((current) => ({
        ...current,
        [list]: current[list].map((row, position) =>
          position === index ? { ...row, [key]: e.target.value } : row,
        ),
      }));
  const addRow = (list: 'categories' | 'performances') =>
    setValues((current) => ({
      ...current,
      [list]: [...current[list], list === 'categories' ? emptyCategory() : emptyPerformance()],
    }));
  const removeRow = (list: 'categories' | 'performances', index: number) =>
    setValues((current) => ({
      ...current,
      [list]: current[list].filter((_, position) => position !== index),
    }));

  const withoutCategories = values.categories.length === 0;

  const onSubmit = async (e) => {
    e.preventDefault();
    const result = toCreateTicketProductionInput(values, shop);
    if ('errors' in result) {
      setInvalid(result.errors);
      return;
    }
    setInvalid([]);
    setSaving(true);
    try {
      const production = await createTicketProduction(result.input);
      toast.success(
        formatMessage({ id: 'production_created', defaultMessage: 'Production created as draft' }),
      );
      push(`/ext/ticketing/${generateUniqueId(production)}`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        headerText={formatMessage({ id: 'production_new', defaultMessage: 'New production' })}
      />
      <form onSubmit={onSubmit} className="mt-5 space-y-8" noValidate>
        <section className="rounded-md border border-border-default bg-surface p-5">
          <SectionTitle>
            {formatMessage({ id: 'production_texts', defaultMessage: 'Production' })}
          </SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={formatMessage({ id: 'production_title', defaultMessage: 'Title' })}
              value={values.title}
              onChange={set('title')}
              invalid={invalid.includes('title')}
              required
            />
            <Field
              label={formatMessage({ id: 'production_subtitle', defaultMessage: 'Subtitle' })}
              value={values.subtitle}
              onChange={set('subtitle')}
            />
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
        </section>

        <section className="rounded-md border border-border-default bg-surface p-5">
          <SectionTitle>
            {formatMessage({ id: 'sale_rules', defaultMessage: 'Sale rules' })}
          </SectionTitle>
          <SaleRulesFields
            values={values.saleRules}
            onChange={(saleRules) => setValues((current) => ({ ...current, saleRules }))}
            invalid={invalid}
          />
        </section>

        <section className="rounded-md border border-border-default bg-surface p-5">
          <SectionTitle>
            {formatMessage({ id: 'ticket_categories', defaultMessage: 'Ticket categories' })}
          </SectionTitle>
          <p className="mb-3 text-xs text-text-muted">
            {formatMessage({
              id: 'ticket_categories_hint',
              defaultMessage:
                'Each category gets its own capacity and price in every date. Without categories every date has one price.',
            })}
          </p>
          {values.categories.map((category, index) => (
            <div key={index} className="mb-3 grid items-end gap-3 sm:grid-cols-5">
              <Field
                label={formatMessage({ id: 'category_code', defaultMessage: 'Code' })}
                value={category.code}
                onChange={setRow('categories', index, 'code')}
                invalid={invalid.includes(`categories.${index}.code`)}
                placeholder="adult"
              />
              <Field
                label={formatMessage({ id: 'category_name', defaultMessage: 'Name' })}
                value={category.name}
                onChange={setRow('categories', index, 'name')}
              />
              <Field
                label={formatMessage({ id: 'category_capacity', defaultMessage: 'Capacity' })}
                type="number"
                min={0}
                step={1}
                value={category.capacity}
                onChange={setRow('categories', index, 'capacity')}
                invalid={invalid.includes(`categories.${index}.capacity`)}
              />
              <Field
                label={formatMessage(
                  { id: 'category_price', defaultMessage: 'Price ({currency})' },
                  { currency: shop.currencyCode },
                )}
                inputMode="decimal"
                value={category.price}
                onChange={setRow('categories', index, 'price')}
                invalid={invalid.includes(`categories.${index}.price`)}
              />
              <button
                type="button"
                className={secondaryButtonClassName}
                onClick={() => removeRow('categories', index)}
              >
                {formatMessage({ id: 'remove', defaultMessage: 'Remove' })}
              </button>
            </div>
          ))}
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() => addRow('categories')}
          >
            {formatMessage({ id: 'category_add', defaultMessage: 'Add category' })}
          </button>
        </section>

        <section className="rounded-md border border-border-default bg-surface p-5">
          <SectionTitle>{formatMessage({ id: 'performances', defaultMessage: 'Dates' })}</SectionTitle>
          {values.performances.map((performance, index) => (
            <div key={index} className="mb-3 grid items-end gap-3 sm:grid-cols-4">
              <Field
                label={formatMessage({ id: 'event_form_starts_at', defaultMessage: 'Start' })}
                type="datetime-local"
                value={performance.startsAt}
                onChange={setRow('performances', index, 'startsAt')}
                invalid={invalid.includes(`performances.${index}.startsAt`)}
              />
              {withoutCategories && (
                <>
                  <Field
                    label={formatMessage({ id: 'category_capacity', defaultMessage: 'Capacity' })}
                    type="number"
                    min={0}
                    step={1}
                    value={performance.supply}
                    onChange={setRow('performances', index, 'supply')}
                    invalid={invalid.includes(`performances.${index}.supply`)}
                  />
                  <Field
                    label={formatMessage(
                      { id: 'category_price', defaultMessage: 'Price ({currency})' },
                      { currency: shop.currencyCode },
                    )}
                    inputMode="decimal"
                    value={performance.price}
                    onChange={setRow('performances', index, 'price')}
                    invalid={invalid.includes(`performances.${index}.price`)}
                  />
                </>
              )}
              <button
                type="button"
                className={secondaryButtonClassName}
                onClick={() => removeRow('performances', index)}
              >
                {formatMessage({ id: 'remove', defaultMessage: 'Remove' })}
              </button>
            </div>
          ))}
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() => addRow('performances')}
          >
            {formatMessage({ id: 'performance_add', defaultMessage: 'Add date' })}
          </button>
        </section>

        <InvalidFieldsAlert fields={invalid} />
        <div className="flex gap-3">
          <button type="submit" disabled={saving || shop.loading} className={primaryButtonClassName}>
            {formatMessage({ id: 'production_create', defaultMessage: 'Create production' })}
          </button>
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() => push('/ext/ticketing')}
          >
            {formatMessage({ id: 'event_form_cancel', defaultMessage: 'Cancel' })}
          </button>
        </div>
      </form>
    </>
  );
};

export default TicketProductionCreatePage;
