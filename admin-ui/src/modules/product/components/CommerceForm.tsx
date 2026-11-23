import { IRoleAction } from '../../../gql/types';

import { useIntl } from 'react-intl';
import useAuth from '../../Auth/useAuth';
import FormWrapper from '../../common/components/FormWrapper';
import useCountries from '../../country/hooks/useCountries';
import useApp from '../../common/hooks/useApp';

import Form from '../../forms/components/Form';
import FormErrors from '@/components/ui/form/FormErrors';
import SubmitButton from '@/components/ui/form/SubmitButton';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import useProductCatalogPrices from '../hooks/useProductCatalogPrices';
import useUpdateProductCommerce from '../hooks/useUpdateProductCommerce';
import { toPricingFormValues } from '../utils/price.utils';
import PricingFields from './PricingFields';

const normalizeCatalogPrices = (prices = [], currencies = []) =>
  currencies.length
    ? toPricingFormValues(
        prices.map(({ country, currency, ...price }) => ({
          ...price,
          countryCode: country.isoCode,
          currencyCode: currency.isoCode,
        })),
        currencies,
      )
    : [];

const CommerceForm = ({ productId, disabled = false }) => {
  const { formatMessage } = useIntl();
  const { catalogPrices } = useProductCatalogPrices({ productId });
  const { hasRole } = useAuth();

  const { updateProductCommerce } = useUpdateProductCommerce();
  const { countries } = useCountries();
  const { currencies } = useApp();

  const baseCountry = countries?.find(({ isBase }) => isBase);

  const defaultCountryValue = baseCountry?.isoCode;
  const defaultCurrencyValue = baseCountry?.defaultCurrency?.isoCode;
  const onSubmit: OnSubmitType = async ({ pricing }) => {
    await updateProductCommerce({ productId, commerce: { pricing } });
    return { success: true };
  };
  const successMessage = formatMessage({
    id: 'saved',
    defaultMessage: 'Saved',
  });
  const normalizedCatalogPrices = normalizeCatalogPrices(
    catalogPrices,
    currencies,
  );
  const form = useForm({
    disabled,
    submit: onSubmit,
    successMessage,
    enableReinitialize: true,
    initialValues: {
      pricing: [
        ...(normalizedCatalogPrices?.length
          ? normalizedCatalogPrices
          : [
              {
                minQuantity: '',
                amount: null,
                isTaxable: false,
                isNetPrice: false,
                currencyCode: defaultCurrencyValue,
                countryCode: defaultCountryValue,
              },
            ]),
      ],
    },
  });

  return (
    <div>
      <div className="mt-5 md:col-span-3 lg:mt-0">
        <FormWrapper>
          <Form
            className="mt-3 rounded-md"
            form={form}
            disabled={!hasRole(IRoleAction.ManageProducts)}
          >
            <div className="relative max-w-full p-3 sm:px-5">
              <div className="max-w-full justify-between align-baseline" />

              <PricingFields
                name="pricing"
                defaultCountryValue={defaultCountryValue}
                defaultCurrencyValue={defaultCurrencyValue}
                countries={countries}
                currencies={currencies}
              />
            </div>
            <FormErrors displayFieldErrors />

            {hasRole(IRoleAction.ManageProducts) && (
              <div className="-mx-6 p-6 bg-surface-subtle text-right">
                <SubmitButton
                  className="mx-6"
                  label={formatMessage({
                    id: 'save',
                    defaultMessage: 'Save',
                  })}
                />
              </div>
            )}
          </Form>
        </FormWrapper>
        <p className="mt-6 mb-10 text-sm text-text-muted">
          {formatMessage({
            id: 'product_commerce_info',
            defaultMessage:
              'Every country and currency needs one price with a min quantity of 0 (or empty), and no two prices may share the same min quantity, currency and country',
          })}
        </p>
      </div>
    </div>
  );
};

export default CommerceForm;
