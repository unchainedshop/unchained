import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';

import BreadCrumbs from '@/components/ui/BreadCrumbs';
import PageHeader from '@/components/ui/PageHeader';
import Loading from '@/components/ui/Loading';
import NoData from '@/components/ui/NoData';

import useShopSettingsNamespaces from '../../modules/settings/hooks/useShopSettingsNamespaces';
import SettingsList from '../../modules/settings/components/SettingsList';
import SettingsDetailPage from './SettingsDetailPage';

const Settings = () => {
  const { formatMessage } = useIntl();
  const { query } = useRouter();
  const { namespace } = query;

  const { namespaces, loading } = useShopSettingsNamespaces();

  if (namespace) return <SettingsDetailPage namespace={namespace as string} />;

  return (
    <>
      <BreadCrumbs />
      <PageHeader
        headerText={formatMessage({
          id: 'settings',
          defaultMessage: 'Settings',
        })}
      />
      <div className="min-w-full overflow-x-auto px-1">
        {loading && namespaces.length === 0 ? (
          <Loading />
        ) : namespaces.length === 0 ? (
          <NoData
            message={formatMessage({
              id: 'settings_namespaces',
              defaultMessage: 'settings namespaces',
            })}
          />
        ) : (
          <SettingsList namespaces={namespaces} />
        )}
      </div>
    </>
  );
};

export default Settings;
