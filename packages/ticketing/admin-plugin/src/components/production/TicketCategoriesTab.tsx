import { useState } from 'react';
import { useAuth } from '@unchainedshop/admin-ui/hooks';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import { Button, FormWrapper, NoData, Table } from '@unchainedshop/admin-ui/ui';
import { CheckboxField, Form, SubmitButton, TextField } from '@unchainedshop/admin-ui/form';
import { DangerMessage } from '@unchainedshop/admin-ui/modal';
import { useApp, useForm, useModal } from '@unchainedshop/admin-ui/hooks';
import useShopDefaults from '../../hooks/useShopDefaults.ts';
import useTicketProductionMutations from '../../hooks/useTicketProductionMutations.ts';
import { centsToDecimal, isCategoryCode, toCents, toCount } from '../../utils/production-form.ts';
import { useFormatPrice } from '../../utils/misc.ts';
import { FormFooter, errorMessage } from './fields.tsx';

// Adds a category, or changes the one given: name, capacity and price of new dates.
const CategoryForm = ({ production, category, onDone }) => {
  const { formatMessage } = useIntl();
  const { selectedLocale } = useApp();
  const shop = useShopDefaults();
  const { addTicketCategory, updateTicketCategory } = useTicketProductionMutations();
  const invalid = formatMessage({ id: 'invalid_value', defaultMessage: 'Enter a valid value' });

  const form = useForm({
    submit: async ({ code, name, capacity, price, applyToPerformances }) => {
      const errors = [
        !category && !isCategoryCode(code) && 'code',
        Number.isNaN(toCount(capacity)) && 'capacity',
        Number.isNaN(toCents(price)) && 'price',
      ].filter(Boolean);
      if (errors.length) {
        errors.forEach((field) => form.api.setFieldError(field, invalid));
        return { success: false, error: { message: '' } };
      }
      const amount = toCents(price);
      const input = {
        texts: [{ locale: selectedLocale, title: name || '' }],
        capacity: toCount(capacity),
        ...(amount !== null && {
          pricing: [{ amount, currencyCode: shop.currencyCode, countryCode: shop.countryCode }],
        }),
      };
      try {
        if (category) {
          await updateTicketCategory(production._id, category.code, input, Boolean(applyToPerformances));
        } else {
          await addTicketCategory(production._id, { code: code.trim(), ...input });
        }
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
    successMessage: category
      ? formatMessage({ id: 'category_saved', defaultMessage: 'Category saved' })
      : formatMessage({ id: 'category_added', defaultMessage: 'Category added to all dates' }),
    initialValues: {
      code: category?.code || '',
      name: category?.option?.texts?.title || '',
      capacity:
        category?.capacity === null || category?.capacity === undefined ? '' : String(category.capacity),
      price: centsToDecimal(category?.pricing?.[0]?.amount),
      applyToPerformances: false,
    },
  });

  return (
    <FormWrapper>
      <Form form={form}>
        <div className="p-5 pb-7">
          <h3 className="mb-4 text-base font-medium text-text-primary">
            {category
              ? formatMessage(
                  { id: 'category_edit_title', defaultMessage: 'Edit category {code}' },
                  { code: category.code },
                )
              : formatMessage({ id: 'category_add', defaultMessage: 'Add category' })}
          </h3>
          <div className="grid gap-4 sm:grid-cols-4">
            <TextField
              name="code"
              label={formatMessage({ id: 'category_code', defaultMessage: 'Code' })}
              placeholder="adult"
              disabled={Boolean(category)}
              required={!category}
            />
            <TextField name="name" label={formatMessage({ id: 'name', defaultMessage: 'Name' })} />
            <TextField
              name="capacity"
              type="number"
              label={formatMessage({ id: 'category_capacity', defaultMessage: 'Capacity' })}
            />
            <TextField
              name="price"
              label={formatMessage(
                { id: 'category_price', defaultMessage: 'Price ({currency})' },
                { currency: shop.currencyCode },
              )}
            />
          </div>
          {category && (
            <div className="mt-4">
              <CheckboxField
                name="applyToPerformances"
                label={formatMessage({
                  id: 'category_apply',
                  defaultMessage: 'Also set the capacity and price in every date',
                })}
              />
            </div>
          )}
          {!category && (
            <p className="mt-3 text-xs text-text-muted">
              {formatMessage({
                id: 'category_add_hint',
                defaultMessage:
                  'Every date gets tickets in the new category. The first category takes over the tickets the dates already have.',
              })}
            </p>
          )}
        </div>
        <FormFooter>
          {category && (
            <Button
              variant="secondary"
              text={formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
              onClick={onDone}
            />
          )}
          <SubmitButton
            label={
              category
                ? formatMessage({ id: 'save', defaultMessage: 'Save' })
                : formatMessage({ id: 'category_add', defaultMessage: 'Add category' })
            }
          />
        </FormFooter>
      </Form>
    </FormWrapper>
  );
};

/**
 * The ticket categories of a production with the capacity and price a new date gets in each. A
 * change applies to the dates only when asked to.
 */
const TicketCategoriesTab = ({ production }: { production: any }) => {
  const { formatMessage } = useIntl();
  const { formatPrice } = useFormatPrice();
  const { hasRole } = useAuth();
  const { setModal } = useModal();
  const { removeTicketCategory } = useTicketProductionMutations();
  const [editing, setEditing] = useState<string | null>(null);
  // A new key after a save gives an empty form again
  const [formKey, setFormKey] = useState(0);
  const categories = production.ticketProduction.categories ?? [];
  const canManage = hasRole('manageProducts');

  const onRemove = (code: string) =>
    setModal(
      <DangerMessage
        onCancelClick={() => setModal('')}
        message={formatMessage({
          id: 'category_remove_confirmation',
          defaultMessage:
            'Remove this category from all dates? Categories with sold tickets cannot be removed.',
        })}
        onOkClick={async () => {
          setModal('');
          try {
            await removeTicketCategory(production._id, code);
            toast.success(formatMessage({ id: 'category_removed', defaultMessage: 'Category removed' }));
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
        okText={formatMessage({ id: 'delete', defaultMessage: 'Delete' })}
      />,
    );

  const editedCategory = categories.find(({ code }) => code === editing);

  return (
    <div className="space-y-6">
      {categories.length ? (
        <Table className="min-w-full">
          <Table.Row header>
            <Table.Cell>{formatMessage({ id: 'category_code', defaultMessage: 'Code' })}</Table.Cell>
            <Table.Cell>{formatMessage({ id: 'name', defaultMessage: 'Name' })}</Table.Cell>
            <Table.Cell>
              {formatMessage({ id: 'category_capacity', defaultMessage: 'Capacity' })}
            </Table.Cell>
            <Table.Cell>{formatMessage({ id: 'price', defaultMessage: 'Price' })}</Table.Cell>
            <Table.Cell> </Table.Cell>
          </Table.Row>
          {categories.map((category) => (
            <Table.Row key={category.code}>
              <Table.Cell>
                <span className="font-medium text-text-primary">{category.code}</span>
              </Table.Cell>
              <Table.Cell>{category.option?.texts?.title || '-'}</Table.Cell>
              <Table.Cell>{category.capacity ?? '-'}</Table.Cell>
              <Table.Cell>{category.pricing?.[0] ? formatPrice(category.pricing[0]) : '-'}</Table.Cell>
              <Table.Cell>
                {canManage && (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      text={formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
                      onClick={() => setEditing(category.code)}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      text={formatMessage({ id: 'delete', defaultMessage: 'Delete' })}
                      onClick={() => onRemove(category.code)}
                    />
                  </div>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table>
      ) : (
        <NoData
          message={formatMessage({ id: 'ticket_categories_noun', defaultMessage: 'ticket categories' })}
        />
      )}
      {canManage && (
        <CategoryForm
          key={`${editing || 'new'}-${formKey}`}
          production={production}
          category={editedCategory}
          onDone={() => {
            setEditing(null);
            setFormKey((current) => current + 1);
          }}
        />
      )}
    </div>
  );
};

export default TicketCategoriesTab;
