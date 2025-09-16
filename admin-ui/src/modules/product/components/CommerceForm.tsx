import React from 'react';
import { FieldArray } from 'formik';
import { useIntl } from 'react-intl';
import useAuth from '../../Auth/useAuth';
import FormWrapper from '../../common/components/FormWrapper';
import convertArrayOfObjectToObject from '../../common/convertArrayOfObjectToObject';
import useCountries from '../../country/hooks/useCountries';
import useCurrencies from '../../currency/hooks/useCurrencies';

import CheckboxField from '../../forms/components/CheckboxField';
import Form from '../../forms/components/Form';
import FormErrors from '../../forms/components/FormErrors';
import SelectField from '../../forms/components/SelectField';
import SubmitButton from '../../forms/components/SubmitButton';
import TextField from '../../forms/components/TextField';
import Button from '../../common/components/Button';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import {
  validateProductCommerce,
  validateProductCommerceOneNull,
} from '../../forms/lib/validators';
import useProductCatalogPrices from '../hooks/useProductCatalogPrices';
import useUpdateProductCommerce from '../hooks/useUpdateProductCommerce';
import { fromMinorUnit } from '../utils/price.utils';

const normalizeCatalogPrices = (prices = [], currencies = []) => {
  if (!currencies.length) return [];
  return prices.map((price) => {
    const currency = currencies.find(
      ({ isoCode }) =>
        isoCode.toLowerCase() === price.currency.isoCode.toLowerCase(),
    );
    return {
      countryCode: price.country.isoCode,
      currencyCode: price.currency.isoCode,
      isTaxable: !!price.isTaxable,
      isNetPrice: !!price.isNetPrice,
      amount: fromMinorUnit(price.amount, currency?.decimals),
      maxQuantity: price.maxQuantity,
    };
  });
};

const CommerceForm = ({ productId, disabled = false }) => {
  const { formatMessage } = useIntl();
  const { catalogPrices } = useProductCatalogPrices({ productId });
  const { hasRole } = useAuth();

  const { updateProductCommerce } = useUpdateProductCommerce();
  const { countries } = useCountries();
  const { currencies } = useCurrencies();

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
                maxQuantity: '',
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

  const { values } = form.formik;
  const { pricing } = values;
  return (
    <div>
      <div className="mt-5 md:col-span-3 lg:mt-0">
        <FormWrapper>
          <Form className="mt-3 rounded-md" form={form}>
            <div className="relative max-w-full p-3 sm:px-5">
              <div className="max-w-full justify-between align-baseline" />

              <label className="sr-only flex w-full font-sans text-sm text-slate-500 dark:text-slate-200 lg:not-sr-only">
                <span className="flex w-full">
                  <span className="w-full">
                    {formatMessage({
                      id: 'max_quantity',
                      defaultMessage: 'Max Quantity',
                    })}
                  </span>
                  <span className="w-full lg:ml-5">
                    {formatMessage({
                      id: 'price',
                      defaultMessage: 'Price',
                    })}
                  </span>
                </span>
                <span className="flex w-full">
                  <span className="w-full lg:ml-8">
                    {formatMessage({
                      id: 'vat_suspect',
                      defaultMessage: 'Vat Suspect',
                    })}
                  </span>
                  <span className="w-full lg:ml-12">
                    {formatMessage({
                      id: 'net_price',
                      defaultMessage: 'Net Price',
                    })}
                  </span>
                </span>
                <span className="mr-5 flex w-full">
                  <span className="ml-10 w-full">
                    {formatMessage({
                      id: 'country',
                      defaultMessage: 'Country',
                    })}
                  </span>
                  <span className="w-full">
                    {formatMessage({
                      id: 'currency',
                      defaultMessage: 'Currency',
                    })}
                  </span>
                </span>
              </label>

              <FieldArray name="pricing">
                {({ push, remove: removeConfig }) => (
                  <div>
                    {values.pricing.map((p, index) => {
                      return (
                        <div
                          key={index}
                          className="relative max-w-full border-b dark:border-slate-700 pt-1 pb-5 mb-3 align-baseline lg:flex"
                        >
                          <div className="flex w-full gap-x-2">
                            <TextField
                              className="w-full"
                              validators={[
                                validateProductCommerce(index, pricing),
                                validateProductCommerceOneNull(pricing),
                              ]}
                              name={`pricing[${index}].maxQuantity`}
                              id={`pricing[${index}].maxQuantity`}
                              type="number"
                              min={0}
                              hideLabel
                              label={formatMessage({
                                id: 'max_quantity',
                                defaultMessage: 'Max Quantity',
                              })}
                            />
                            <TextField
                              type="number"
                              className="w-full"
                              name={`pricing[${index}].amount`}
                              id={`pricing[${index}].amount`}
                              required
                              hideLabel
                              label={formatMessage({
                                id: 'price',
                                defaultMessage: 'Price  ',
                              })}
                            />
                          </div>

                          <div className="flex w-full gap-x-2 pt-3 pb-2">
                            <div className="w-full lg:ml-8 lg:items-center">
                              <CheckboxField
                                name={`pricing[${index}].isTaxable`}
                                labelClassName="lg:sr-only items-center "
                                label={formatMessage({
                                  id: 'vat_suspect',
                                  defaultMessage: 'Vat Suspect',
                                })}
                                className="mr-2 h-4 w-4 rounded-sm border-slate-300 dark:border-slate-600 bg-white dark:!bg-slate-900 text-slate-950 focus:ring-slate-800 lg:items-center"
                                type="checkbox"
                              />
                            </div>

                            <div className="w-full lg:ml-8">
                              <CheckboxField
                                name={`pricing[${index}].isNetPrice`}
                                labelClassName="lg:sr-only items-center"
                                label={formatMessage({
                                  id: 'net_price',
                                  defaultMessage: 'Net Price',
                                })}
                                hideLabel
                                className="mr-2 h-4 w-4 justify-between rounded-sm border-slate-300 dark:border-slate-600 bg-white dark:!bg-slate-900 text-slate-950 focus:ring-slate-800 lg:items-center"
                                type="checkbox"
                              />
                            </div>
                          </div>

                          <div className="flex w-full gap-x-2 mt-1">
                            <SelectField
                              defaultValue={defaultCountryValue}
                              className="w-full lg:ml-4 lg:mr-4"
                              label={formatMessage({
                                id: 'country',
                                defaultMessage: 'Country',
                              })}
                              name={`pricing[${index}].countryCode`}
                              id={`pricing[${index}].countryCode`}
                              required
                              options={convertArrayOfObjectToObject(
                                countries,
                                'isoCode',
                                'isoCode',
                              )}
                              hideLabel
                            />

                            <SelectField
                              defaultValue={defaultCurrencyValue}
                              className="w-full lg:mr-8 "
                              label={formatMessage({
                                id: 'currency',
                                defaultMessage: 'Currency',
                              })}
                              name={`pricing[${index}].currencyCode`}
                              id={`pricing[${index}].currencyCode`}
                              required
                              options={convertArrayOfObjectToObject(
                                currencies,
                                'isoCode',
                                'isoCode',
                              )}
                              hideLabel
                              placeholder={formatMessage({
                                id: 'country_currency',
                                defaultMessage: 'Currency',
                              })}
                            />
                          </div>

                          <div className="absolute -top-2 right-0 mt-0 mr-0 shrink-0  pb-1 md:mr-0 lg:mt-6 lg:py-0 lg:px-0 ">
                            <button
                              className="items-center rounded-full bg-white dark:bg-slate-900 px-1 py-1 text-sm text-rose-500 dark:text-rose-400 hover:bg-rose-50 focus:outline-hidden focus:ring-0 focus:ring-rose-500 focus:ring-offset-2"
                              type="button"
                              onClick={() => removeConfig(index)}
                            >
                              <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="mt-6">
                      <Button
                        variant="tertiary"
                        text={formatMessage({
                          id: 'add_price_row',
                          defaultMessage: 'Add Price Row',
                        })}
                        className="w-full items-center justify-center"
                        onClick={() =>
                          push({
                            maxQuantity: '',
                            amount: null,
                            isTaxable: false,
                            isNetPrice: false,
                            currencyCode: defaultCurrencyValue,
                            countryCode: defaultCountryValue,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </FieldArray>
            </div>
            <FormErrors displayFieldErrors />
            <div className="-mx-6 p-6 bg-slate-50 dark:bg-slate-900 text-right">
              <SubmitButton
                className="mx-6"
                hidden={!hasRole('editProductCommerce')}
                label={formatMessage({
                  id: 'save',
                  defaultMessage: 'Save',
                })}
              />
            </div>
          </Form>
        </FormWrapper>
        <p className="mt-6 mb-10 text-sm text-slate-500 dark:text-slate-400">
          {formatMessage({
            id: 'product_commerce_info',
            defaultMessage:
              'One price list should have a max quantity field empty and no price should have the same max quantity along with currency and country specified',
          })}
        </p>
      </div>
    </div>
  );
};

export default CommerceForm;
