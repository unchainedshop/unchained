import { useIntl } from 'react-intl';
import useCheckGateCookie from '../hooks/useCheckGateCookie';
import GatePassCodeForm from '../components/GatePassCodeForm';
import GateControl from '../components/GateControl';
import { Loading } from '@unchainedshop/admin-ui/ui';

const GateControlPage = () => {
  const { formatMessage } = useIntl();
  const { authenticated, loading, refetch } = useCheckGateCookie();

  return (
    <div className="px-6 pt-8 pb-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {formatMessage({
            id: 'gate_control_header',
            defaultMessage: 'Gate Control',
          })}
        </h1>
      </div>
      {loading ? (
        <Loading />
      ) : authenticated ? (
        <GateControl onLogout={() => refetch()} />
      ) : (
        <GatePassCodeForm onAuthenticated={() => refetch()} />
      )}
    </div>
  );
};

export default GateControlPage;
