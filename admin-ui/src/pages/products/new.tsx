import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import FormWrapper from '../../modules/common/components/FormWrapper';
import PageHeader from '../../modules/common/components/PageHeader';
import generateUniqueId from '../../modules/common/utils/getUniqueId';
import {
  OnSubmitSuccessType,
  OnSubmitType,
} from '../../modules/forms/hooks/useForm';
import ProductForm from '../../modules/product/components/ProductForm';
import useCreateProduct from '../../modules/product/hooks/useCreateProduct';
import { PRODUCT_TYPES } from '../../modules/product/ProductTypes';
import LocaleWrapper from '../../modules/common/components/LocaleWrapper';

const AddProduct = () => {
  const { createProduct } = useCreateProduct();
  const router = useRouter();
  const { formatMessage } = useIntl();
  const onSubmitSuccess: OnSubmitSuccessType = (_, { ...result }) => {
    router.replace(`/products?slug=${generateUniqueId(result)}`);
    return true;
  };

  const onSubmit: OnSubmitType = async ({ texts, type, tags }) => {
    const { data, error } = await createProduct({
      product: {
        type: PRODUCT_TYPES[type],
        tags,
      },
      texts,
    });
    if (error) return { success: false };
    return { success: true, data: data?.createProduct };
  };
  return (
    <>
      <BreadCrumbs />
      <PageHeader
        headerText={formatMessage({
          id: 'new_product_header',
          defaultMessage: 'New product',
        })}
      />
      <div className="mt-6 lg:grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <FormWrapper>
            <LocaleWrapper>
              <ProductForm
                onSubmit={onSubmit}
                onSubmitSuccess={onSubmitSuccess}
              />
            </LocaleWrapper>
          </FormWrapper>
        </div>
        <div className="mt-10 lg:mt-0 lg:col-span-1 space-y-2">
          <h3 className="text-lg text-slate-900 dark:text-slate-200">
            {formatMessage({
              id: 'product_type',
              defaultMessage: 'Product type',
            })}
          </h3>
          <div className="text-sm divide-y divide-slate-200 dark:divide-slate-800 dark:text-slate-400 lg:mr-10">
            <div className="my-2 py-2">
              <FormattedMessage
                id="simple_product_definition"
                defaultMessage=" <h3>Simple</h3> <p>Simple product is the most commonly used type of product type. It accepts configuration values for price, dimension and warehousing. Most e-commerce product needs are satisfied by this type </p>"
                values={{
                  h3: (chunks) => <h3 className="font-semibold ">{chunks}</h3>,
                  p: (chunks) => <p>{chunks}</p>,
                }}
              />
            </div>
            <div className="my-2 py-2">
              <FormattedMessage
                id="plan_product_definition"
                defaultMessage=" <h3>Plan</h3> <p>Plan product is use when you have a product that is offered per subscription base. Since for this type of product the payment is usually recurring, you can adjust the interval of payment calculation.

              </p>"
                values={{
                  h3: (chunks) => <h3 className="font-semibold ">{chunks}</h3>,
                  p: (chunks) => <p>{chunks}</p>,
                }}
              />
            </div>
            <div className="my-2 py-2">
              <FormattedMessage
                id="bundle_product_definition"
                defaultMessage=" <h3>Bundle</h3> <p>As the name suggest this product type enables you to create a collection/bundle of products as one and set the price accordingly. This type of product is useful if you have christmas package for example.  </p>"
                values={{
                  h3: (chunks) => <h3 className="font-semibold ">{chunks}</h3>,
                  p: (chunks) => <p>{chunks}</p>,
                }}
              />
            </div>
            <div className="my-2 py-2">
              <FormattedMessage
                id="configurable_product_definition"
                defaultMessage=" <h3>Configurable</h3> <p>Configurable Product is used to organize varieties of a product. A product might have a variation in color, size or other distinct property in that case you can use a configurable product type to organize all the variation under one category and outline-solid there difference. </p>"
                values={{
                  h3: (chunks) => <h3 className="font-semibold ">{chunks}</h3>,
                  p: (chunks) => <p>{chunks}</p>,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddProduct;
