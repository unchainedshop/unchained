import React, { useCallback, useState } from 'react';
import { IRoleAction } from '../../../gql/types';

import { useIntl } from 'react-intl';
import { ISortDirection } from '../../../gql/types';
import useAuth from '../../Auth/useAuth';
import FilterableDropdown from '../../common/components/FilterableDropdown';
import Form from '../../forms/components/Form';
import SubmitButton from '../../forms/components/SubmitButton';
import TextField from '../../forms/components/TextField';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import useCreateProductBundleItem from '../hooks/useCreateProductBundleItem';
import useProducts from '../hooks/useProducts';
import Button from '../../common/components/Button';
import { SparklesIcon } from 'lucide-react';
import useModal from '../../modal/hooks/useModal';
import BundleItemScaffoldForm from './BundleItemScaffoldForm';
import useProduct from '../hooks/useProduct';

const normalizeProduct = (products = []) => {
  return products.map(({ _id, status, texts, media }) => ({
    id: _id,
    tag: status,
    ...texts,
    image: media?.length ? media[0]?.file?.url : null,
  }));
};
const BundleProductsForm = ({
  productId: currentProductId,
  disabled = false,
}) => {
  const { product } = useProduct({ productId: currentProductId });
  const { setModal } = useModal();
  const [queryString, setQueryString] = useState('');
  const { createProductBundleItem } = useCreateProductBundleItem();
  const { hasRole } = useAuth();
  const { formatMessage } = useIntl();
  const { products, loading } = useProducts({
    queryString,
    includeDrafts: true,
    limit: 50,
    sort: [{ key: 'created', value: ISortDirection.Desc }],
  });

  const onSubmit: OnSubmitType = async ({ productId, quantity }) => {
    await createProductBundleItem({
      item: { productId, quantity },
      productId: currentProductId,
    });
    return { success: true };
  };
  const successMessage = formatMessage({
    id: 'bundle_item_added',
    defaultMessage: 'Bundle product added successfully',
  });
  const form = useForm({
    disabled,
    submit: onSubmit,
    successMessage,
    onSubmitSuccess: () => {
      form.formik.resetForm();
      return null;
    },
    initialValues: {
      productId: '',
      quantity: 1,
    },
  });

  const scaffoldVariationProduct = useCallback(async () => {
    await setModal(
      <BundleItemScaffoldForm
        bundleProduct={product}
        onSuccess={async (newProduct, quantity = 1) => {
          await createProductBundleItem({
            item: { productId: newProduct._id, quantity },
            productId: currentProductId,
          });

          setModal('');
        }}
      />,
    );
  }, [product]);
  return (
    <Form form={form}>
      <div className="flex items-end gap-2 w-full">
        <div className="flex-1">
          <FilterableDropdown
            name="productId"
            onFilter={setQueryString}
            queryString={queryString}
            label={formatMessage({ id: 'product', defaultMessage: 'Product' })}
            data={normalizeProduct(products)}
            isLoading={loading}
            className="w-full text-sm font-medium text-slate-500"
            required
          />
        </div>
        {hasRole(IRoleAction.ManageProducts) && (
          <div className="pb-3">
            <Button
              className="flex items-center justify-center p-2 rounded-md"
              onClick={scaffoldVariationProduct}
            >
              <SparklesIcon className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      <TextField
        name="quantity"
        type="number"
        required
        label={formatMessage({ id: 'quantity', defaultMessage: 'Quantity' })}
      />
      {hasRole(IRoleAction.ManageProducts) && (
        <SubmitButton
          label={formatMessage({ id: 'submit', defaultMessage: 'Submit' })}
          className="mt-2"
        />
      )}
    </Form>
  );
};

export default BundleProductsForm;
