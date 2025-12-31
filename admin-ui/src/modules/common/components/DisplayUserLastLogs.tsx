import { useIntl } from 'react-intl';
import useFormatDateTime from '../utils/useFormatDateTime';
import {
  normalizeCountryISOCode,
  normalizeLanguageISOCode,
} from '../utils/utils';

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-4">
    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
      {title}
    </h3>
    {subtitle && (
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        {subtitle}
      </p>
    )}
  </div>
);

const KeyValueRow = ({ label, value }) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
    <label className="text-sm text-slate-600 dark:text-slate-400 mb-1 md:mb-0 md:mr-4">
      {label}
    </label>
    <span className="text-sm text-right text-slate-900 dark:text-slate-200">
      {value || '-'}
    </span>
  </div>
);

const LoginInfo = ({ loginData }) => {
  const { formatMessage, locale } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden mt-4 p-4">
      <SectionHeader
        title={formatMessage({ id: 'last_login', defaultMessage: 'Last Login' })}
        subtitle={formatMessage({
          id: 'last_login_description',
          defaultMessage: 'Information from the most recent login session',
        })}
      />
      {!loginData ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {formatMessage({
            id: 'no_login_data',
            defaultMessage: 'No login data available yet',
          })}
        </p>
      ) : (
        <>
          <KeyValueRow
            label={formatMessage({ id: 'country', defaultMessage: 'Country' })}
            value={
              loginData?.countryCode &&
              normalizeCountryISOCode(locale, loginData?.countryCode)
            }
          />
          <KeyValueRow
            label={formatMessage({ id: 'language', defaultMessage: 'Language' })}
            value={
              loginData?.locale &&
              normalizeLanguageISOCode(locale, loginData.locale?.split('_')[0])
            }
          />
          <KeyValueRow
            label={formatMessage({ id: 'browser', defaultMessage: 'Browser' })}
            value={loginData.userAgent}
          />
          <KeyValueRow
            label={formatMessage({ id: 'ip', defaultMessage: 'IP Address' })}
            value={loginData.remoteAddress}
          />
          <KeyValueRow
            label={formatMessage({ id: 'logged_in_at', defaultMessage: 'Logged in at' })}
            value={
              loginData.timestamp
                ? formatDateTime(loginData?.timestamp, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })
                : null
            }
          />
        </>
      )}
    </div>
  );
};

const BillingAddressInfo = ({
  firstName,
  lastName,
  company,
  addressLine,
  addressLine2,
  postalCode,
  countryCode,
  regionCode,
  city,
}) => {
  const { formatMessage, locale } = useIntl();

  const hasAddress = firstName || lastName || company || addressLine || city || countryCode;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden mt-4 p-4">
      <SectionHeader
        title={formatMessage({
          id: 'last_billing_address',
          defaultMessage: 'Last Billing Address',
        })}
        subtitle={formatMessage({
          id: 'last_billing_address_description',
          defaultMessage: 'The billing address used in the most recent order',
        })}
      />
      {!hasAddress ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {formatMessage({
            id: 'no_billing_address',
            defaultMessage: 'No billing address on record yet',
          })}
        </p>
      ) : (
        <>
          <KeyValueRow
            label={formatMessage({ id: 'fullName', defaultMessage: 'Full Name' })}
            value={
              firstName || lastName
                ? `${firstName || ''} ${lastName || ''}`.trim()
                : null
            }
          />
          <KeyValueRow
            label={formatMessage({ id: 'company', defaultMessage: 'Company' })}
            value={company}
          />
          <KeyValueRow
            label={formatMessage({ id: 'address', defaultMessage: 'Address' })}
            value={addressLine}
          />
          <KeyValueRow
            label={formatMessage({ id: 'address2', defaultMessage: 'Address 2' })}
            value={addressLine2}
          />
          <KeyValueRow
            label={formatMessage({
              id: 'postal_code',
              defaultMessage: 'Postal/ZIP code',
            })}
            value={postalCode}
          />
          <KeyValueRow
            label={formatMessage({ id: 'city', defaultMessage: 'City' })}
            value={city}
          />
          <KeyValueRow
            label={formatMessage({ id: 'region', defaultMessage: 'Region' })}
            value={regionCode}
          />
          <KeyValueRow
            label={formatMessage({ id: 'country', defaultMessage: 'Country' })}
            value={countryCode ? normalizeCountryISOCode(locale, countryCode) : null}
          />
        </>
      )}
    </div>
  );
};

const DisplayUserLastLogs = ({ lastBillingAddress, lastLogin }) => (
  <div className="space-y-4">
    <LoginInfo loginData={lastLogin} />
    <BillingAddressInfo {...(lastBillingAddress || {})} />
  </div>
);

export default DisplayUserLastLogs;
