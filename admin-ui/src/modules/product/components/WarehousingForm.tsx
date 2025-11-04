import { useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { IUpdateProductWarehousingInput } from '../../../gql/types';
import useAuth from '../../Auth/useAuth';
import FormWrapper from '../../common/components/FormWrapper';

import Form from '../../forms/components/Form';
import SubmitButton from '../../forms/components/SubmitButton';
import TextField from '../../forms/components/TextField';
import useForm from '../../forms/hooks/useForm';
import useProductWarehousing from '../hooks/useProductWarehousing';
import useUpdateProductWarehousing from '../hooks/useUpdateProductWarehousing';

const WarehousingForm = ({ productId, disabled = false }) => {
  const { formatMessage } = useIntl();
  const { product } = useProductWarehousing({ productId });
  const { hasRole } = useAuth();
  const { updateProductWarehousing } = useUpdateProductWarehousing();

  const successMessage = formatMessage({
    id: 'saved',
    defaultMessage: 'Saved',
  });

  const onSubmit = async ({
    sku,
    baseUnit,
  }: IUpdateProductWarehousingInput) => {
    const data = await updateProductWarehousing({
      productId,
      warehousing: { baseUnit, sku },
    });
    return { data, success: true };
  };

  const form = useForm({
    disabled,
    submit: onSubmit,
    successMessage,
    initialValues: {
      sku: '',
      baseUnit: '',
    },
  });

  useEffect(() => {
    if (Object.keys(product).length) {
      form.formik.setValues({ ...product });
    }
  }, [product]);
  return (
    <div className="mt-5 md:mt-0">
      <FormWrapper>
        <Form
          className="rounded"
          form={form}
          disabled={!hasRole('manageProducts')}
        >
          <div className="relative px-4 pb-5 sm:p-6">
            <div className="w-full justify-between align-baseline lg:flex gap-6">
              <TextField
                name="sku"
                disabled={!hasRole('manageProducts')}
                id="sku"
                label={formatMessage({
                  id: 'sku',
                  defaultMessage: 'SKU',
                })}
                className="mb-4 text-sm"
              />

              <TextField
                name="baseUnit"
                id="baseUnit"
                disabled={!hasRole('manageProducts')}
                label={formatMessage({
                  id: 'baseUnit',
                  defaultMessage: 'Base Unit',
                })}
                className="text-sm"
              />
            </div>
          </div>
          {hasRole('manageProducts') && (
            <div className="border-t-slate-100 border-t dark:border-t-slate-700 space-y-6 bg-slate-50 dark:bg-slate-900 text-right sm:p-6">
              <SubmitButton
                label={formatMessage({
                  id: 'save',
                  defaultMessage: 'Save',
                })}
              />
            </div>
          )}
        </Form>
      </FormWrapper>
    </div>
  );
};

export default WarehousingForm;
