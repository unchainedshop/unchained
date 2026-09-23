import { useIntl } from 'react-intl';
import { IRoleAction } from '../../gql/types';

import BreadCrumbs from '@/components/ui/BreadCrumbs';
import PageHeader from '@/components/ui/PageHeader';
import Loading from '@/components/ui/Loading';
import FormWrapper from '../../modules/common/components/FormWrapper';
import useAuth from '../../modules/Auth/useAuth';

import useShopSettings from '../../modules/settings/hooks/useShopSettings';
import useUpdateShopSettings from '../../modules/settings/hooks/useUpdateShopSettings';
import SettingsForm from '../../modules/settings/components/SettingsForm';

const SettingsDetailPage = ({ namespace }: { namespace: string }) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { schema, values, loading } = useShopSettings({ namespace });
  const { updateShopSettings } = useUpdateShopSettings();

  const canManage = hasRole(IRoleAction.ManageShopSettings);

  const onSubmit = async (formValues: Record<string, unknown>) => {
    await updateShopSettings({ namespace, value: formValues });
    return true;
  };

  return (
    <>
      <BreadCrumbs currentPageTitle={namespace} />
      <PageHeader headerText={namespace} />
      {loading ? (
        <Loading />
      ) : (
        <div className="mx-auto mt-6 sm:max-w-xl">
          <FormWrapper>
            {schema ? (
              <SettingsForm
                schema={schema}
                values={values}
                onSubmit={onSubmit}
                disabled={!canManage}
              />
            ) : (
              <div className="p-5 text-text-secondary">
                {formatMessage({
                  id: 'settings_no_schema',
                  defaultMessage:
                    'No schema found for this namespace. The namespace may not be registered.',
                })}
              </div>
            )}
          </FormWrapper>
        </div>
      )}
    </>
  );
};

export default SettingsDetailPage;
