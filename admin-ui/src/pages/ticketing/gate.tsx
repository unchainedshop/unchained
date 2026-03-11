import Link from 'next/link';
import { useIntl } from 'react-intl';
import { gql } from '@apollo/client';
import useCurrentUser from '../../modules/accounts/hooks/useCurrentUser';
import GatePassCodeForm from '../../modules/ticketing/components/GatePassCodeForm';
import GateControl from '../../modules/ticketing/components/GateControl';
import useCheckGateCookie from '../../modules/ticketing/hooks/useCheckGateCookie';

const CheckGateCookieQuery = gql`
  query CheckGateCookie {
    isPassCodeValid
  }
`;

const GateControlPage = () => {
  const { formatMessage } = useIntl();
  const { currentUser } = useCurrentUser();
  const isAdmin = Boolean(currentUser?._id);
  const { authenticated, loading, refetch } = useCheckGateCookie();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-6 pt-16 pb-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {formatMessage({
            id: 'gate_control_header',
            defaultMessage: 'Gate Control',
          })}
        </h1>
      </div>
      <div className="absolute top-4 right-16">
        <Link
          href={currentUser?._id ? '/' : '/log-in'}
          className="inline-flex items-center rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {formatMessage({
            id: currentUser?._id ? 'back_to_admin' : 'back_to_login',
            defaultMessage: currentUser?._id ? 'Back to Admin' : 'Log in',
          })}
        </Link>
      </div>
      {authenticated ? (
        <GateControl
          onLogout={!isAdmin ? () => refetch() : undefined}
          isAdmin={isAdmin}
        />
      ) : loading ? null : (
        <GatePassCodeForm onAuthenticated={() => refetch()} />
      )}
    </div>
  );
};

GateControlPage.getLayout = (page) => page;

export default GateControlPage;
