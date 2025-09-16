import { useIntl } from 'react-intl';
import useFormatDateTime from '../utils/useFormatDateTime';
import {
  normalizeCountryISOCode,
  normalizeLanguageISOCode,
} from '../utils/utils';

const KeyValueRow = ({ label, value }) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
    <label className="text-sm text-slate-600 dark:text-slate-400 mb-1 md:mb-0 md:mr-4">
      {label}
    </label>
    <span className="text-sm text-right text-slate-900 dark:text-slate-200">
      {value}
    </span>
  </div>
);

const LoginInfo = ({ loginData }) => {
  const { formatMessage, locale } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  if (!loginData) return null;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden mt-4 p-4">
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
        label={formatMessage({ id: 'time', defaultMessage: 'Time' })}
        value={
          loginData.timestamp
            ? formatDateTime(loginData?.timestamp, {
                dateStyle: 'short',
                timeStyle: 'short',
              })
            : 'n/a'
        }
      />
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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden mt-4 p-4">
      <KeyValueRow
        label={formatMessage({ id: 'fullName', defaultMessage: 'FullName' })}
        value={`${firstName || ''} ${lastName || ''}`}
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
        label={formatMessage({ id: 'country', defaultMessage: 'Country' })}
        value={normalizeCountryISOCode(locale, countryCode)}
      />
      <KeyValueRow
        label={formatMessage({ id: 'city', defaultMessage: 'City' })}
        value={city}
      />
      <KeyValueRow
        label={formatMessage({ id: 'region', defaultMessage: 'Region' })}
        value={regionCode}
      />
    </div>
  );
};

const DisplayUserLastLogs = ({ lastBillingAddress, lastLogin }) => (
  <div>
    <div className="row">
      <LoginInfo loginData={lastLogin} />
    </div>
    <div className="row">
      <BillingAddressInfo {...lastBillingAddress} />
    </div>
  </div>
);

export default DisplayUserLastLogs;
