import { useIntl } from 'react-intl';
import { IRoleAction } from '../../../gql/types';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import Form from '../../forms/components/Form';
import TextField from '../../forms/components/TextField';
import SubmitButton from '../../forms/components/SubmitButton';
import useAuth from '../../Auth/useAuth';
import { useMemo } from 'react';
import useScaffoldVariationProduct from '../hooks/useScaffoldVariationProduct';
import SelectField from '../../forms/components/SelectField';
import { IProductType } from '../../../gql/types';

const ProductAssignmentScaffoldForm = ({
  proxyProduct,
  vectors,
  onSuccess,
}) => {
  const { formatMessage } = useIntl();
  const scaffoldProduct = useScaffoldVariationProduct({
    onSuccess,
    proxyProduct,
    vectors,
  });
  const { hasRole } = useAuth();

  const variations = useMemo(
    () => vectors.map(({ value }) => value),
    [vectors],
  );

  const defaultTitle = useMemo(() => {
    const baseTitle = proxyProduct?.texts?.title ?? '';
    return `${variations.join('-')} ${baseTitle}`.trim();
  }, [variations, proxyProduct]);

  const onSubmit: OnSubmitType = async ({ title, type }) => {
    try {
      await scaffoldProduct({ title, type });
      return { success: true };
    } catch (e) {
      return { success: false, error: { message: e?.message } };
    }
  };
  const successMessage = formatMessage({
    id: 'product-scaffolded-success',
    defaultMessage: 'Product scaffolded successfully',
  });
  const form = useForm({
    submit: onSubmit,
    successMessage,
    enableReinitialize: true,
    initialValues: {
      title: defaultTitle,
      type: IProductType.SimpleProduct,
    },
  });

  return (
    <Form className="mt-3 rounded-md" form={form}>
      <div className="p-5 pb-7 sm:max-w-full flex flex-col gap-3">
        <TextField
          name="title"
          id="title"
          label={formatMessage({
            id: 'name',
            defaultMessage: 'Name',
          })}
          required
          className="block w-full max-w-full rounded-md border-slate-300 dark:border-slate-800 text-sm focus:ring-slate-800 sm:text-sm"
        />
        <SelectField
          className="mt-1 w-full"
          label={formatMessage({ id: 'type', defaultMessage: 'Type' })}
          placeholder={formatMessage({ id: 'type', defaultMessage: 'Type' })}
          required
          name="type"
          options={Object.fromEntries(
            // TODO: Fix this mapping when ProductTypes is fixed
            Object.entries(IProductType).map(([key, value]) => [value, key]),
          )}
        />
      </div>

      {hasRole(IRoleAction.ManageProducts) && (
        <div className="border-t border-t-slate-100 dark:border-t-slate-700 bg-slate-50 dark:bg-slate-900 p-5 text-right">
          <SubmitButton
            label={formatMessage({
              id: 'scaffold_product',
              defaultMessage: 'Scaffold',
            })}
          />
        </div>
      )}
    </Form>
  );
};

export default ProductAssignmentScaffoldForm;
