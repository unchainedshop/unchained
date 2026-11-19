import { IRoleAction } from '../../../gql/types';

import {
  useFieldArray,
  useFormContext as useRHFContext,
} from 'react-hook-form';
import { useIntl } from 'react-intl';
import useAuth from '../../Auth/useAuth';
import convertArrayOfObjectToObject from '../../common/convertArrayOfObjectToObject';

import CheckboxField from '@/components/ui/form/CheckboxField';
import SelectField from '@/components/ui/form/SelectField';
import TextField from '@/components/ui/form/TextField';
import Button from '@/components/ui/Button';
import {
  validateProductCommerce,
  validateProductCommerceOneZero,
} from '../../forms/lib/validators';

const PricingFieldArray = ({
  name,
  defaultCountryValue,
  defaultCurrencyValue,
  countries,
  currencies,
}) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { watch, getValues, trigger } = useRHFContext();
  const { fields, append, remove } = useFieldArray({ name });
  const pricing = watch(name);
  const getPricing = () => getValues(name);

  const revalidateMinQuantities = () => {
    const names = fields.map((_, i) => `${name}.${i}.minQuantity`);
    setTimeout(() => trigger(names), 0);
  };

  return (
    <div>
      {fields.map((field, index) => {
        const minQtyValidators = [validateProductCommerce(index, getPricing)];
        if (index === 0) {
          minQtyValidators.push(validateProductCommerceOneZero(getPricing));
        }
        return (
          <div
            key={field.id}
            className="relative max-w-full border-b dark:border-slate-700 pt-1 pb-5 mb-3 align-baseline lg:flex"
          >
            <div className="flex w-full gap-x-2">
              <TextField
                className="w-full"
                disabled={!hasRole(IRoleAction.ManageProducts)}
                validators={minQtyValidators}
                name={`${name}.${index}.minQuantity`}
                id={`${name}.${index}.minQuantity`}
                type="number"
                min={0}
                hideLabel
                onChange={revalidateMinQuantities}
                label={formatMessage({
                  id: 'min_quantity',
                  defaultMessage: 'Min Quantity',
                })}
              />
              <TextField
                type="number"
                className="w-full"
                disabled={!hasRole(IRoleAction.ManageProducts)}
                name={`${name}.${index}.amount`}
                id={`${name}.${index}.amount`}
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
                  name={`${name}.${index}.isTaxable`}
                  labelClassName="lg:sr-only items-center "
                  disabled={!hasRole(IRoleAction.ManageProducts)}
                  label={formatMessage({
                    id: 'vat_suspect',
                    defaultMessage: 'Vat Suspect',
                  })}
                  className="mr-2 h-4 w-4 rounded-sm border-border-default bg-white dark:!bg-slate-900 text-slate-950 focus:ring-focus-ring lg:items-center"
                  type="checkbox"
                />
              </div>

              <div className="w-full lg:ml-8">
                <CheckboxField
                  name={`${name}.${index}.isNetPrice`}
                  labelClassName="lg:sr-only items-center"
                  disabled={!hasRole(IRoleAction.ManageProducts)}
                  label={formatMessage({
                    id: 'net_price',
                    defaultMessage: 'Net Price',
                  })}
                  hideLabel
                  className="mr-2 h-4 w-4 justify-between rounded-sm border-border-default bg-white dark:!bg-slate-900 text-slate-950 focus:ring-focus-ring lg:items-center"
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
                name={`${name}.${index}.countryCode`}
                id={`${name}.${index}.countryCode`}
                disabled={!hasRole(IRoleAction.ManageProducts)}
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
                disabled={!hasRole(IRoleAction.ManageProducts)}
                name={`${name}.${index}.currencyCode`}
                id={`${name}.${index}.currencyCode`}
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

            {hasRole(IRoleAction.ManageProducts) && (
              <div className="absolute -top-2 right-0 mt-0 mr-0 shrink-0  pb-1 md:mr-0 lg:mt-6 lg:py-0 lg:px-0 ">
                <button
                  className="items-center rounded-full bg-surface-input px-1 py-1 text-sm text-rose-500 dark:text-rose-400 hover:bg-rose-50 focus:outline-hidden focus:ring-0 focus:ring-rose-500 focus:ring-offset-2"
                  type="button"
                  onClick={() => remove(index)}
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
            )}
          </div>
        );
      })}
      {hasRole(IRoleAction.ManageProducts) && (
        <div className="mt-6">
          <Button
            variant="tertiary"
            text={formatMessage({
              id: 'add_price_row',
              defaultMessage: 'Add Price Row',
            })}
            className="w-full items-center justify-center"
            onClick={() =>
              append({
                minQuantity: '',
                amount: null,
                isTaxable: false,
                isNetPrice: false,
                currencyCode: defaultCurrencyValue,
                countryCode: defaultCountryValue,
              })
            }
          />
        </div>
      )}
    </div>
  );
};

const PricingFields = ({
  name = 'pricing',
  defaultCountryValue,
  defaultCurrencyValue,
  countries,
  currencies,
}) => {
  const { formatMessage } = useIntl();
  return (
    <>
      <label className="sr-only flex w-full font-sans text-sm text-text-muted lg:not-sr-only">
        <span className="flex w-full">
          <span className="w-full">
            {formatMessage({
              id: 'min_quantity',
              defaultMessage: 'Min Quantity',
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
      <PricingFieldArray
        name={name}
        defaultCountryValue={defaultCountryValue}
        defaultCurrencyValue={defaultCurrencyValue}
        countries={countries}
        currencies={currencies}
      />
    </>
  );
};

export default PricingFields;
