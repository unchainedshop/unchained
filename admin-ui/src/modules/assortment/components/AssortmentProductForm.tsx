import { useState } from 'react';
import { useIntl } from 'react-intl';

import Form from '../../forms/components/Form';
import SubmitButton from '../../forms/components/SubmitButton';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';

import useAddAssortmentProduct from '../hooks/useAddAssortmentProduct';
import FilterableDropdown from '../../common/components/FilterableDropdown';
import TagInputField from '../../forms/components/TagInputField';
import useAuth from '../../Auth/useAuth';
import FormWrapper from '../../common/components/FormWrapper';
import useProducts from '../../product/hooks/useProducts';
import { ISortDirection } from '../../../gql/types';

const normalizeProducts = (productsList = []) => {
  return productsList?.map(({ _id, status, texts, media }) => ({
    id: _id,
    tag: status,
    ...texts,
    image: media?.length ? media[0]?.file?.url : null,
  }));
};

const AssortmentProductForm = ({ assortmentId }) => {
  const [queryString, setQueryString] = useState('');
  const { formatMessage } = useIntl();
  const { addAssortmentProduct } = useAddAssortmentProduct();
  const { hasRole } = useAuth();

  const successMessage = formatMessage({
    id: 'saved',
    defaultMessage: 'Saved',
  });

  const { products, loading } = useProducts({
    queryString,
    includeDrafts: true,
    limit: 50,
    sort: [{ key: 'created', value: ISortDirection.Desc }],
  });

  const onSubmit: OnSubmitType = async ({ productId, tags }) => {
    await addAssortmentProduct({ productId, assortmentId, tags });
    return { success: true };
  };

  const form = useForm({
    submit: onSubmit,
    successMessage,
    initialValues: {
      productId: '',
      tags: '',
    },
  });

  return (
    <FormWrapper>
      <Form form={form} id="assortment_product_form">
        <div className="shadow dark:shadow-none sm:rounded-md">
          <div className="grid gap-6 px-4 py-5 sm:p-6">
            <div className="col-span-12">
              <TagInputField
                name="tags"
                id="tags"
                className="mt-1 w-full text-sm"
              />

              <FilterableDropdown
                name="productId"
                data={normalizeProducts(products)}
                isLoading={loading}
                label={formatMessage({
                  id: 'product',
                  defaultMessage: 'Product',
                })}
                required
                onFilter={setQueryString}
                queryString={queryString}
                className="mt-1 w-full py-2 text-sm text-slate-500"
              />
            </div>
          </div>
          <div className="border-t-slate-100 border-t dark:border-t-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-5 text-right sm:px-6">
            <SubmitButton
              hidden={!hasRole('addAssortmentProduct')}
              label={formatMessage({
                id: 'save',
                defaultMessage: 'Save',
              })}
            />
          </div>
        </div>
      </Form>
    </FormWrapper>
  );
};

export default AssortmentProductForm;
