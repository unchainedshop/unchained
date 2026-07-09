import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import { useApolloClient } from '@apollo/client/react';
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/20/solid';

import Button from '@/components/ui/Button';
import useModal from '../../modal/hooks/useModal';
import DangerMessage from '../../modal/components/DangerMessage';
import useLogoutAllSessions from '../hooks/useLogoutAllSessions';
import useCurrentUser from '../hooks/useCurrentUser';

const SessionsView = ({ userId }) => {
  const { formatMessage } = useIntl();
  const { currentUser } = useCurrentUser();
  const { logoutAllSessions } = useLogoutAllSessions();
  const { setModal } = useModal();
  const apollo = useApolloClient();
  const router = useRouter();
  const isOwnUser = currentUser?._id === userId;

  const onLogoutOwnSessions = async () => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'logout_all_sessions_confirmation',
          defaultMessage:
            'You will be signed out on this and every other device. Continue?',
        })}
        onOkClick={async () => {
          setModal('');
          await logoutAllSessions();
          try {
            await apollo.resetStore();
          } catch (e) {
            if ((e as any)?.name !== 'AbortError') throw e;
          }
          router.push('/log-in');
        }}
        okText={formatMessage({
          id: 'logout_everywhere',
          defaultMessage: 'Log out everywhere',
        })}
      />,
    );
  };

  const onForceLogoutUser = async () => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'force_logout_confirmation',
          defaultMessage:
            'All active sessions of this user will be invalidated and the user will have to sign in again. Continue?',
        })}
        onOkClick={async () => {
          setModal('');
          await logoutAllSessions({ userId });
          toast.success(
            formatMessage({
              id: 'force_logout_success',
              defaultMessage: 'All sessions of the user have been terminated',
            }),
          );
        }}
        okText={formatMessage({
          id: 'force_logout',
          defaultMessage: 'Force logout',
        })}
      />,
    );
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-text-muted">
        {isOwnUser
          ? formatMessage({
              id: 'logout_all_sessions_own_description',
              defaultMessage:
                'Sign out of all sessions on every device, including this one.',
            })
          : formatMessage({
              id: 'logout_all_sessions_admin_description',
              defaultMessage:
                'Invalidate all active sessions of this user, for example if the account might be compromised.',
            })}
      </p>
      <Button
        variant="danger"
        icon={<ArrowRightStartOnRectangleIcon className="h-5 w-5" />}
        onClick={isOwnUser ? onLogoutOwnSessions : onForceLogoutUser}
        text={
          isOwnUser
            ? formatMessage({
                id: 'logout_everywhere',
                defaultMessage: 'Log out everywhere',
              })
            : formatMessage({
                id: 'force_logout',
                defaultMessage: 'Force logout',
              })
        }
      />
    </div>
  );
};

export default SessionsView;
