import { useIntl } from 'react-intl';
import SaveAndCancelButtons from '../../common/components/SaveAndCancelButtons';
import TextField from '../../forms/components/TextField';

const AddressFields = ({ isEdit, address, setIsEdit }) => {
  const { formatMessage } = useIntl();

  return (
    <dl className="space-y-4 -mb-6">
      <div>
        {!isEdit && (
          <label className="text-sm text-slate-400 dark:text-slate-200">
            {formatMessage({
              id: 'full_name',
              defaultMessage: 'Full name',
            })}
          </label>
        )}
        <div className="flex text-sm text-slate-900 dark:text-slate-200 sm:col-span-2 sm:mt-0">
          {isEdit ? (
            <div className="flex w-full gap-2">
              <TextField
                className="w-full"
                labelClassName="text-sm text-slate-400 dark:text-slate-200"
                name="firstName"
                label={formatMessage({
                  id: 'first_name',
                  defaultMessage: 'First name',
                })}
              />
              <TextField
                className="w-full"
                labelClassName="text-sm text-slate-400 dark:text-slate-200"
                name="lastName"
                label={formatMessage({
                  id: 'last_Name',
                  defaultMessage: 'Last name',
                })}
              />
            </div>
          ) : (
            <span className="grow">
              {address?.firstName} {address?.lastName}{' '}
            </span>
          )}
        </div>
      </div>
      <div>
        <label className="text-sm text-slate-400 dark:text-slate-200">
          {!isEdit &&
            formatMessage({
              id: 'company',
              defaultMessage: 'Company',
            })}
        </label>
        <div className="mt-1 flex text-sm text-slate-900 dark:text-slate-200 sm:mt-0">
          {isEdit ? (
            <TextField
              className="mt-0 w-full"
              name="company"
              label={formatMessage({
                id: 'company',
                defaultMessage: 'Company',
              })}
            />
          ) : (
            <span className="grow">{address?.company}</span>
          )}
        </div>
      </div>
      <div>
        <label className="text-sm text-slate-400 dark:text-slate-200">
          {!isEdit &&
            formatMessage({
              id: 'address_line_1',
              defaultMessage: 'Address line 1 (Street, House no)',
            })}
        </label>
        <div className="mt-1 flex text-sm text-slate-900 dark:text-slate-200 sm:mt-0">
          {isEdit ? (
            <TextField
              className="mt-0 w-full"
              name="addressLine"
              label={formatMessage({
                id: 'address_line_1',
                defaultMessage: 'Address line 1 (Street, House no)',
              })}
            />
          ) : (
            <span className="grow">{address?.addressLine}</span>
          )}
        </div>
      </div>
      <div>
        <label className="text-sm text-slate-400 dark:text-slate-200">
          {!isEdit &&
            formatMessage({
              id: 'address_line_2',
              defaultMessage: 'Address line 2',
            })}
        </label>
        <div className="mt-1 flex text-sm text-slate-900 dark:text-slate-200 sm:mt-0">
          {isEdit ? (
            <TextField
              className="mt-0 w-full"
              name="addressLine2"
              label={formatMessage({
                id: 'address_line_2',
                defaultMessage: 'Address line 2',
              })}
            />
          ) : (
            <span className="grow">{address?.addressLine2}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-2 sm:grid-cols-2">
        <div>
          <label className="text-sm text-slate-400 dark:text-slate-200">
            {!isEdit &&
              formatMessage({
                id: 'region',
                defaultMessage: 'Region',
              })}
          </label>

          <div className="mt-1 flex text-sm text-slate-900 dark:text-slate-200 sm:mt-0">
            {isEdit ? (
              <TextField
                className="mt-0 w-full"
                name="regionCode"
                label={formatMessage({
                  id: 'region_Code',
                  defaultMessage: 'Region',
                })}
              />
            ) : (
              address?.regionCode
            )}
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-400 dark:text-slate-200">
            {!isEdit &&
              formatMessage({
                id: 'postal_code',
                defaultMessage: 'Postal/ZIP code',
              })}
          </label>
          <div className="mt-1 w-full text-sm text-slate-900 dark:text-slate-200 sm:mt-0">
            {isEdit ? (
              <TextField
                className="mt-0 w-full"
                name="postalCode"
                label={formatMessage({
                  id: 'postal_code',
                  defaultMessage: 'Postal/ZIP code',
                })}
              />
            ) : (
              address?.postalCode
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm text-slate-400 dark:text-slate-200">
            {!isEdit &&
              formatMessage({
                id: 'city',
                defaultMessage: 'City',
              })}
          </label>
          <div className="mt-1 text-sm text-slate-900 dark:text-slate-200 sm:mt-0">
            {isEdit ? (
              <TextField
                className="mt-0 w-full"
                name="city"
                label={formatMessage({
                  id: 'city',
                  defaultMessage: 'City',
                })}
              />
            ) : (
              address?.city
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm text-slate-400 dark:text-slate-200">
            {!isEdit &&
              formatMessage({
                id: 'country_code',
                defaultMessage: 'Country code',
              })}
          </label>
          <div className="mt-1 text-sm text-slate-900 dark:text-slate-200 sm:mt-0">
            {isEdit ? (
              <TextField
                className="mt-0 w-full"
                name="countryCode"
                label={formatMessage({
                  id: 'country_code',
                  defaultMessage: 'Country code',
                })}
              />
            ) : (
              address?.countryCode
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-t-slate-100 dark:border-t-slate-700 mt-3 -mx-6 -mb-6 bg-slate-50 dark:bg-slate-800 flex shrink-0 items-center justify-end space-x-4 pr-5">
        {isEdit ? (
          <SaveAndCancelButtons onCancel={() => setIsEdit(!isEdit)} />
        ) : null}
      </div>
    </dl>
  );
};

export default AddressFields;
