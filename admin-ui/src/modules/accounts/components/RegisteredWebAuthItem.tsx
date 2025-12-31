import { useIntl } from 'react-intl';
import Badge from '../../common/components/Badge';
import DeleteButton from '../../common/components/DeleteButton';
import ImageWithFallback from '../../common/components/ImageWithFallback';
import defaultNextImageLoader from '../../common/utils/defaultNextImageLoader';
import useFormatDateTime from '../../common/utils/useFormatDateTime';

// Known authenticator types by AAGUID (for common passkey providers not in MDS)
const KNOWN_AUTHENTICATORS: Record<string, { name: string; icon?: string }> = {
  // Apple iCloud Keychain
  'fbfc3007-154e-4ecc-8c0b-6e020557d7bd': { name: 'Apple iCloud Keychain' },
  // Google Password Manager
  'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4': { name: 'Google Password Manager' },
  // Windows Hello
  '08987058-cadc-4b81-b6e1-30de50dcbe96': { name: 'Windows Hello' },
  // 1Password
  'bada5566-a7aa-401f-bd96-45619a55120d': { name: '1Password' },
  'b84e4048-15dc-4dd0-8640-f4f60813c8af': { name: '1Password' },
  // Bitwarden
  'd548826e-79b4-db40-a3d8-11116f7e8349': { name: 'Bitwarden' },
  // Dashlane
  '531126d6-e717-415c-9320-3d9aa6981239': { name: 'Dashlane' },
  // Zero AAGUID (software/unknown authenticator)
  '00000000-0000-0000-0000-000000000000': { name: 'Software Authenticator' },
};

const getAuthenticatorInfo = (
  aaguid: string,
  mdsMetadata: { description?: string; icon?: string } | null,
) => {
  // First try MDS metadata
  if (mdsMetadata?.description) {
    return {
      name: mdsMetadata.description,
      icon: mdsMetadata.icon,
    };
  }

  // Then try known authenticators
  const normalizedAaguid = aaguid?.toLowerCase();
  if (normalizedAaguid && KNOWN_AUTHENTICATORS[normalizedAaguid]) {
    return KNOWN_AUTHENTICATORS[normalizedAaguid];
  }

  // Default to showing the AAGUID
  return {
    name: 'Passkey',
    icon: undefined,
  };
};

const RegisteredWebAuthItem = ({
  _id,
  aaguid,
  counter,
  created,
  md5Metadata,
  onRemoveCredential,
  removeDisabled,
}) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const authInfo = getAuthenticatorInfo(aaguid, md5Metadata);

  // Create a short identifier from the credential ID (first 8 chars)
  const shortId = _id ? _id.substring(0, 8).toUpperCase() : '';

  return (
    <li className="col-span-1 flex shadow-xs rounded-md border border-slate-200 dark:border-slate-700 mb-2">
      <div className="shrink-0 flex items-center justify-center w-16 text-sm font-medium rounded-l-md bg-slate-50 dark:bg-slate-900">
        {authInfo.icon ? (
          <ImageWithFallback
            className="inline-block h-10 w-10 rounded-full"
            src={authInfo.icon}
            loader={defaultNextImageLoader}
            width={36}
            height={36}
            alt={authInfo.name}
          />
        ) : (
          <svg
            className="h-8 w-8 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        )}
      </div>
      <div className="flex-1 flex items-center justify-between dark:bg-slate-800 bg-white rounded-r-md truncate dark:text-slate-200">
        <div className="flex-1 px-4 py-3 text-sm truncate">
          <div className="flex items-center gap-2">
            <span className="text-slate-900 dark:text-slate-200 font-medium">
              {authInfo.name}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-mono">
              #{shortId}
            </span>
          </div>
          <span className="text-slate-500 dark:text-slate-400 text-xs block mt-1">
            {formatMessage(
              { id: 'web_auth_used_times', defaultMessage: 'Used {count} times' },
              { count: counter || 0 },
            )}
          </span>
        </div>
        <div className="shrink-0 pr-4 text-right">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {formatDateTime(created)}
          </div>
          {!removeDisabled && (
            <div className="mt-1">
              <DeleteButton onClick={() => onRemoveCredential(_id)} />
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

export default RegisteredWebAuthItem;
