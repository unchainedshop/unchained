import { useIntl } from 'react-intl';
import Link from 'next/link';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import Badge from '../../common/components/Badge';
import ImageWithFallback from '../../common/components/ImageWithFallback';
import CopyableId from './shared/CopyableId';

export const CopilotUserListItem = ({ user }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  if (!user) return null;

  const tabFields = [
    {
      key: 'orders',
      label: formatMessage({ id: 'orders', defaultMessage: 'Orders' }),
      href: `/users?userId=${user._id}&tab=orders`,
    },
    {
      key: 'enrollments',
      label: formatMessage({
        id: 'enrollments',
        defaultMessage: 'Enrollments',
      }),
      href: `/users?userId=${user._id}&tab=enrollments`,
    },
    {
      key: 'reviews',
      label: formatMessage({ id: 'reviews', defaultMessage: 'Reviews' }),
      href: `/users?userId=${user._id}&tab=reviews`,
    },
    {
      key: 'quotations',
      label: formatMessage({ id: 'quotations', defaultMessage: 'Quotations' }),
      href: `/users?userId=${user._id}&tab=quotations`,
    },
    {
      key: 'paymentCredentials',
      label: formatMessage({
        id: 'payment_credentials',
        defaultMessage: 'Payment Credentials',
      }),
      href: `/users?userId=${user._id}&tab=payment_credentials`,
    },
    {
      key: 'tokens',
      label: formatMessage({ id: 'tokens', defaultMessage: 'Tokens' }),
      href: `/users?userId=${user._id}&tab=tokens`,
    },
  ];

  const [avatar] = user?.avatar || [];
  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      key={user._id}
      className="relative border rounded-xl p-4 shadow-sm bg-white dark:bg-slate-900 space-y-4 w-full"
    >
      <div className="flex justify-between items-start w-full">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
            {avatar?.file?.url ? (
              <ImageWithFallback
                src={avatar?.file?.url}
                alt={user?.name}
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {initials}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {user?.name} {' - '} {user?.username ? `@${user?.username}` : ''}
            </h3>

            {user?.emails?.length > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user?.primaryEmail?.address}{' '}
                {!user?.primaryEmail?.verified ? (
                  <Badge
                    text={formatMessage({
                      id: 'unverified',
                      defaultMessage: 'Unverified',
                    })}
                    color="yellow"
                    square
                  />
                ) : (
                  <Badge
                    text={formatMessage({
                      id: 'verified',
                      defaultMessage: 'Verified',
                    })}
                    color="green"
                    square
                  />
                )}
              </p>
            )}

            {user?.roles?.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {user.roles.map((role) => (
                  <Badge key={role} text={role} color="purple" square />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatMessage({ id: 'roles', defaultMessage: 'Roles' })}: –
              </p>
            )}

            <p className="text-xs text-slate-400 mt-1">
              {formatMessage({
                id: 'registered',
                defaultMessage: 'Registered',
              })}
              : {formatDateTime(user.created)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end text-xs text-slate-500 dark:text-slate-400 ml-4 whitespace-nowrap gap-1">
          <Link
            href={`/users?userId=${user._id}`}
            className="mt-2 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
          </Link>
          <CopyableId id={user._id} />

          {!!user.guest && (
            <Badge
              text={formatMessage({ id: 'guest', defaultMessage: 'Guest' })}
              color="yellow"
              square
            />
          )}

          {user?.lastLogin?.timestamp && (
            <span>
              {formatMessage({
                id: 'last_login',
                defaultMessage: 'Last log in',
              })}
              :{' '}
              {formatDateTime(user.lastLogin.timestamp, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>
      {user?.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3 w-full">
          {user.tags.map((tag) => (
            <Badge key={tag} text={tag} color="blue" />
          ))}
        </div>
      )}
      <div className="flex flex-wrap justify-between gap-4 mt-4 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-3">
        {tabFields.map(({ key, label, href }) => {
          const count = user[key]?.length ?? 0;
          return (
            <Link
              key={key}
              href={href}
              className="hover:underline flex items-center gap-1"
            >
              <span className="font-medium">{label}:</span>
              <span>{count}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const CopilotUserList = ({ users, toolCallId }) => {
  const { formatMessage } = useIntl();

  if (!users?.length) {
    return (
      <div className="p-4 text-center text-slate-500">
        {formatMessage({
          id: 'no_users_found',
          defaultMessage: 'No users found',
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {users.map((user) => (
        <CopilotUserListItem key={`${user._id}-${toolCallId}`} user={user} />
      ))}
    </div>
  );
};

export default CopilotUserList;
