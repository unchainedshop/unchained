import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';

import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import PageHeader from '../../modules/common/components/PageHeader';
import useAuth from '../../modules/Auth/useAuth';
import WorkDetailPage from './WorkDetailPage';
import WorkQueueListView from './WorkQueueListView';

const WorkQueueView = () => {
  const { query } = useRouter();
  const { hasRole } = useAuth();
  const { formatMessage } = useIntl();

  const { workerId } = query;

  if (workerId) return <WorkDetailPage workerId={workerId} />;

  return (
    <>
      <BreadCrumbs
        depth={3}
        currentPageTitle={formatMessage({
          id: 'work_queue_header',
          defaultMessage: 'Work queue',
        })}
      />
      <PageHeader
        title={formatMessage({
          id: 'work_queue_header',
          defaultMessage: 'Work queue',
        })}
        addPath={hasRole('manageWorker') && '/works/management'}
        addButtonText={formatMessage({
          id: 'manage',
          defaultMessage: 'Manage',
        })}
      />
      <WorkQueueListView />
    </>
  );
};

export default WorkQueueView;
