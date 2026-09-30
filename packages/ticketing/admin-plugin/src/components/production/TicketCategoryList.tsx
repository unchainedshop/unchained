import { useState } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import { useModal, DangerMessage } from '@unchainedshop/admin-ui/modal';
import useTicketProductionMutations from '../../hooks/useTicketProductionMutations.ts';
import {
  centsToDecimal,
  toCents,
  type CategoryFormValues,
  type ShopDefaults,
} from '../../utils/production-form.ts';
import {
  Field,
  SectionTitle,
  dangerButtonClassName,
  errorMessage,
  primaryButtonClassName,
  secondaryButtonClassName,
} from './fields.tsx';

const CATEGORY_CODE = /^[a-z0-9][a-z0-9_-]*$/;
const WHOLE = /^\d+$/;

const categoryValues = (category): CategoryFormValues => ({
  code: category.code,
  name: category.option?.texts?.title || '',
  capacity:
    category.capacity === null || category.capacity === undefined ? '' : String(category.capacity),
  price: centsToDecimal(category.pricing?.[0]?.amount),
});

// The input of addTicketCategory / updateTicketCategory, or the invalid fields.
const toCategoryInput = (values: CategoryFormValues, shop: ShopDefaults) => {
  const invalid: string[] = [];
  if (!CATEGORY_CODE.test(values.code.trim())) invalid.push('code');
  const capacity = values.capacity.trim();
  if (capacity && !WHOLE.test(capacity)) invalid.push('capacity');
  const amount = toCents(values.price);
  if (Number.isNaN(amount)) invalid.push('price');
  if (invalid.length) return { invalid };
  return {
    input: {
      code: values.code.trim(),
      texts: [{ locale: shop.locale, title: values.name.trim() }],
      capacity: capacity ? Number(capacity) : null,
      ...(amount !== null && {
        pricing: [{ amount, currencyCode: shop.currencyCode, countryCode: shop.countryCode }],
      }),
    },
  };
};

const CategoryRow = ({ production, category, shop }) => {
  const { formatMessage } = useIntl();
  const { setModal } = useModal();
  const { updateTicketCategory, removeTicketCategory } = useTicketProductionMutations();
  const [values, setValues] = useState(() => categoryValues(category));
  const [applyToPerformances, setApplyToPerformances] = useState(false);
  const [invalid, setInvalid] = useState<string[]>([]);
  const set = (key: keyof CategoryFormValues) => (e) =>
    setValues((current) => ({ ...current, [key]: e.target.value }));

  const onSave = async () => {
    const result = toCategoryInput(values, shop);
    if ('invalid' in result) {
      setInvalid(result.invalid);
      return;
    }
    setInvalid([]);

    const { code, ...category } = result.input;
    try {
      await updateTicketCategory(production._id, code, category, applyToPerformances);
      toast.success(formatMessage({ id: 'category_saved', defaultMessage: 'Category saved' }));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const onRemove = () =>
    setModal(
      <DangerMessage
        onCancelClick={() => setModal('')}
        message={formatMessage({
          id: 'category_remove_confirmation',
          defaultMessage:
            'Remove this category from all dates? Categories with tickets cannot be removed.',
        })}
        onOkClick={async () => {
          setModal('');
          try {
            await removeTicketCategory(production._id, category.code);
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
        okText={formatMessage({ id: 'remove', defaultMessage: 'Remove' })}
      />,
    );

  return (
    <div className="grid items-end gap-3 border-t border-border-default py-3 sm:grid-cols-4">
      <div className="text-sm font-medium text-text-primary">{category.code}</div>
      <Field
        label={formatMessage({ id: 'category_name', defaultMessage: 'Name' })}
        value={values.name}
        onChange={set('name')}
      />
      <Field
        label={formatMessage({ id: 'category_capacity', defaultMessage: 'Capacity' })}
        type="number"
        min={0}
        step={1}
        value={values.capacity}
        onChange={set('capacity')}
        invalid={invalid.includes('capacity')}
      />
      <Field
        label={formatMessage(
          { id: 'category_price', defaultMessage: 'Price ({currency})' },
          { currency: shop.currencyCode },
        )}
        inputMode="decimal"
        value={values.price}
        onChange={set('price')}
        invalid={invalid.includes('price')}
      />
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={applyToPerformances}
          onChange={(e) => setApplyToPerformances(e.target.checked)}
          className="rounded border-border-default"
        />
        {formatMessage({ id: 'category_apply', defaultMessage: 'Also for all dates' })}
      </label>
      <div className="flex gap-2">
        <button type="button" className={secondaryButtonClassName} onClick={onSave}>
          {formatMessage({ id: 'save', defaultMessage: 'Save' })}
        </button>
        <button type="button" className={dangerButtonClassName} onClick={onRemove}>
          {formatMessage({ id: 'remove', defaultMessage: 'Remove' })}
        </button>
      </div>
    </div>
  );
};

/**
 * The ticket categories of a production with their defaults for new dates. A change applies to
 * the dates only when asked to; the first category takes over the dates that exist.
 */
const TicketCategoryList = ({ production, shop }: { production: any; shop: ShopDefaults }) => {
  const { formatMessage } = useIntl();
  const { addTicketCategory } = useTicketProductionMutations();
  const empty = { code: '', name: '', capacity: '', price: '' };
  const [values, setValues] = useState<CategoryFormValues>(empty);
  const [invalid, setInvalid] = useState<string[]>([]);
  const categories = production.ticketProduction.categories ?? [];

  const set = (key: keyof CategoryFormValues) => (e) =>
    setValues((current) => ({ ...current, [key]: e.target.value }));

  const onAdd = async () => {
    const result = toCategoryInput(values, shop);
    if ('invalid' in result) {
      setInvalid(result.invalid);
      return;
    }
    setInvalid([]);
    try {
      await addTicketCategory(production._id, result.input);
      setValues(empty);
      toast.success(
        formatMessage({ id: 'category_added', defaultMessage: 'Category added to all dates' }),
      );
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <section className="rounded-md border border-border-default bg-surface p-5">
      <SectionTitle>
        {formatMessage({ id: 'ticket_categories', defaultMessage: 'Ticket categories' })}
      </SectionTitle>
      {categories.map((category) => (
        <CategoryRow key={category.code} production={production} category={category} shop={shop} />
      ))}
      <div className="grid items-end gap-3 border-t border-border-default pt-3 sm:grid-cols-4">
        <Field
          label={formatMessage({ id: 'category_code', defaultMessage: 'Code' })}
          value={values.code}
          onChange={set('code')}
          invalid={invalid.includes('code')}
          placeholder="adult"
        />
        <Field
          label={formatMessage({ id: 'category_name', defaultMessage: 'Name' })}
          value={values.name}
          onChange={set('name')}
        />
        <Field
          label={formatMessage({ id: 'category_capacity', defaultMessage: 'Capacity' })}
          type="number"
          min={0}
          step={1}
          value={values.capacity}
          onChange={set('capacity')}
          invalid={invalid.includes('capacity')}
        />
        <Field
          label={formatMessage(
            { id: 'category_price', defaultMessage: 'Price ({currency})' },
            { currency: shop.currencyCode },
          )}
          inputMode="decimal"
          value={values.price}
          onChange={set('price')}
          invalid={invalid.includes('price')}
        />
        <button type="button" className={primaryButtonClassName} onClick={onAdd}>
          {formatMessage({ id: 'category_add', defaultMessage: 'Add category' })}
        </button>
      </div>
    </section>
  );
};

export default TicketCategoryList;
