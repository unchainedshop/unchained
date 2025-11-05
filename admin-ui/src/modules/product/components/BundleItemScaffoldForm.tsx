import React, { useMemo } from 'react';
import { IRoleAction } from '../../../gql/types';

import { useIntl } from 'react-intl';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import Form from '../../forms/components/Form';
import TextField from '../../forms/components/TextField';
import SubmitButton from '../../forms/components/SubmitButton';
import SelectField from '../../forms/components/SelectField';
import useAuth from '../../Auth/useAuth';
import { PRODUCT_TYPES } from '../ProductTypes';
import useScaffoldBundleItem from '../hooks/useScaffoldBundleItem';

const BundleItemScaffoldForm = ({ bundleProduct, onSuccess }) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();

  const scaffoldProduct = useScaffoldBundleItem({
    onSuccess,
  });

  const defaultTitle = useMemo(() => {
    const baseTitle = bundleProduct?.texts?.title ?? '';
    return `${baseTitle} - New Bundle Item`;
  }, [bundleProduct]);

  const onSubmit: OnSubmitType = async ({ title, type, quantity }) => {
    try {
      await scaffoldProduct({ title, type, quantity });
      return { success: true };
    } catch (e) {
      return { success: false, error: { message: e?.message } };
    }
  };

  const successMessage = formatMessage({
    id: 'bundle-item-scaffolded-success',
    defaultMessage: 'New product scaffolded and added to bundle successfully',
  });

  const form = useForm({
    submit: onSubmit,
    successMessage,
    enableReinitialize: true,
    initialValues: {
      title: defaultTitle,
      type: PRODUCT_TYPES.SimpleProduct,
      quantity: 1,
    },
  });

  return (
    <Form
      className="mt-4 rounded-md border border-slate-200 dark:border-slate-700"
      form={form}
    >
      <div className="p-5 flex flex-col gap-3">
        <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100">
          {formatMessage({
            id: 'scaffold_bundle_item_title',
            defaultMessage: 'Scaffold New Bundle Item',
          })}
        </h3>

        <TextField
          name="title"
          id="title"
          label={formatMessage({
            id: 'name',
            defaultMessage: 'Name',
          })}
          required
          className="block w-full rounded-md border-slate-300 dark:border-slate-800 text-sm"
        />

        <SelectField
          className="mt-1 w-full"
          label={formatMessage({ id: 'type', defaultMessage: 'Type' })}
          placeholder={formatMessage({ id: 'type', defaultMessage: 'Type' })}
          required
          name="type"
          options={Object.fromEntries(
            Object.entries(PRODUCT_TYPES).filter(
              ([, value]) =>
                value !== PRODUCT_TYPES.ConfigurableProduct &&
                value !== PRODUCT_TYPES.BundleProduct,
            ),
          )}
        />
        <TextField
          name="quantity"
          type="number"
          required
          label={formatMessage({ id: 'quantity', defaultMessage: 'Quantity' })}
        />
      </div>

      {hasRole(IRoleAction.ManageProducts) && (
        <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-5 text-right">
          <SubmitButton
            label={formatMessage({
              id: 'scaffold_and_add',
              defaultMessage: 'Scaffold & Add',
            })}
          />
        </div>
      )}
    </Form>
  );
};

export default BundleItemScaffoldForm;
