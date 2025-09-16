import { useIntl } from 'react-intl';
import {
  CheckCircleIcon,
  XCircleIcon,
  DevicePhoneMobileIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import formatUsername from '../utils/formatUsername';
import ImageWithFallback from './ImageWithFallback';

const FallbackAvatar = ({ username }) => {
  return (
    <UserCircleIcon className="h-8 w-8 text-slate-800 dark:text-slate-600" />
  );
};

const DetailHeader = ({ user, contact }) => {
  const { formatMessage } = useIntl();
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-full">
        {user?.avatar ? (
          <ImageWithFallback
            src={user.avatar.url}
            alt={user.name || user.username}
            width={100}
            height={100}
          />
        ) : (
          <FallbackAvatar username={user?.username} />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="flex items-center">
            <h3 className="text-xl font-semibold capitalize">
              <Link
                href={`/users?userId=${user?._id}`}
                className="text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-600"
              >
                {formatUsername(user)}
              </Link>
            </h3>
            {user?.primaryEmail?.verified && (
              <dl className="self-end">
                <dt className="sr-only">
                  {formatMessage({
                    id: 'account_status',
                    defaultMessage: 'Account status',
                  })}
                </dt>
                <dd className="mt-3 flex items-center self-end text-sm font-medium capitalize text-slate-900 sm:mr-6 sm:mt-0">
                  {user?.primaryEmail?.verified ? (
                    <CheckCircleIcon
                      className="h-4 w-4 shrink-0 text-emerald-400"
                      aria-hidden="true"
                    />
                  ) : (
                    <XCircleIcon
                      className="h-4 w-4 shrink-0 text-rose-400"
                      aria-hidden="true"
                    />
                  )}
                </dd>
              </dl>
            )}
          </span>
        </div>

        {contact?.emailAddress && <div>{contact.emailAddress}</div>}
        {contact?.telNumber && <div>{contact.telNumber}</div>}
      </div>
    </div>
  );
};

export default DetailHeader;
