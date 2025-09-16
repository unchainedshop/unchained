import { useIntl } from 'react-intl';
import defaultNextImageLoader from '../utils/defaultNextImageLoader';
import formatUsername from '../utils/formatUsername';
import ImageWithFallback from './ImageWithFallback';
import { useApolloClient } from '@apollo/client/react';
import { toast } from 'react-toastify';
import logOut from '../../accounts/hooks/logOut';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

const UserAvatar = ({ avatar, ...user }) => {
  const { formatMessage } = useIntl();
  const apolloClient = useApolloClient();
  const router = useRouter();

  const onLogout = async () => {
    const userName =
      user?.username || user?.displayName || user?.profile?.displayName || '';
    await logOut(apolloClient, router);
    toast.success(
      formatMessage(
        {
          id: 'goodbye_user',
          defaultMessage: 'See you later, {name}!',
        },
        { name: userName || '' },
      ),
    );
  };

  return (
    <a
      href="#"
      onClick={onLogout}
      className="group block shrink-0 focus:outline-hidden focus:ring-2 focus:ring-slate-800 rounded-md"
    >
      <div className="flex items-center pl-2">
        {avatar ? (
          <ImageWithFallback
            src={avatar?.url}
            loader={defaultNextImageLoader}
            width={36}
            height={36}
            className="rounded-full mr-3 aspect-square object-cover"
            alt={formatMessage({
              id: 'user_avatar',
              defaultMessage: 'User avatar',
            })}
          />
        ) : (
          <span className="inline-block h-6 w-6 overflow-hidden rounded-full mr-3">
            <UserCircleIcon className="h-full w-full text-slate-700 dark:text-slate-300" />
          </span>
        )}
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">
            {formatUsername(user)}
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-600 group-hover:text-slate-700 dark:group-hover:text-slate-400">
            {formatMessage({
              id: 'log_out',
              defaultMessage: 'Log out',
            })}
          </p>
        </div>
      </div>
    </a>
  );
};

export default UserAvatar;
