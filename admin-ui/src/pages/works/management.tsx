import { useIntl } from 'react-intl';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import PageHeader from '../../modules/common/components/PageHeader';
import Tab from '../../modules/common/components/Tab';
import AllocateWorkForm from '../../modules/work/components/AllocateWorkForm';
import WorkForm from '../../modules/work/components/WorkForm';

const GetCurrentTab = ({ selectedView = null }) => {
  if (selectedView === 'add_work') return <WorkForm />;
  if (selectedView === 'allocate_work') return <AllocateWorkForm />;
  return <WorkForm />;
};
const WorkManagement = () => {
  const { formatMessage } = useIntl();

  const workSettingOptions = [
    {
      id: 'add_work',
      title: formatMessage({ id: 'add_work', defaultMessage: 'Add Work' }),
    },
    {
      id: 'allocate_work',
      title: formatMessage({
        id: 'allocate_work',
        defaultMessage: 'Allocate Work',
      }),
    },
  ];

  return (
    <div className="mt-6 max-w-4xl">
      <BreadCrumbs />
      <PageHeader
        headerText={formatMessage({
          id: 'work_management_setting_list_header',
          defaultMessage: 'Work Management Settings',
        })}
      />
      <Tab tabItems={workSettingOptions} defaultTab="add_work">
        <GetCurrentTab />
      </Tab>
    </div>
  );
};

export default WorkManagement;
