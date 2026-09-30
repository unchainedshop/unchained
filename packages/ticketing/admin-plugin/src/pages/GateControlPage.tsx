import { useIntl } from 'react-intl';
import { BreadCrumbs, PageHeader } from '@unchainedshop/admin-ui/ui';
import GateControl from '../components/GateControl.tsx';

const GateControlPage = () => {
  const { formatMessage } = useIntl();

  return (
    <>
      <BreadCrumbs depth={3} />
      <PageHeader
        headerText={formatMessage({ id: 'gate_control_header', defaultMessage: 'Gate Control' })}
      />
      <div className="mt-6">
        <GateControl />
      </div>
    </>
  );
};

export default GateControlPage;
