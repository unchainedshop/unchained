import { useIntl } from 'react-intl';
import GateControl from '../components/GateControl';

const GateControlPage = () => {
  const { formatMessage } = useIntl();

  return (
    <div className="px-6 pt-8 pb-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          {formatMessage({
            id: 'gate_control_header',
            defaultMessage: 'Gate Control',
          })}
        </h1>
      </div>
      <GateControl />
    </div>
  );
};

export default GateControlPage;
