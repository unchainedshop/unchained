import React, { useState } from 'react';
import { IRoleAction } from '../../gql/types';

import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import useAuth from '../../modules/Auth/useAuth';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';

import NewProviderForm from '../../modules/common/components/NewProviderForm';
import PageHeader from '../../modules/common/components/PageHeader';
import convertArrayOfObjectToObject from '../../modules/common/convertArrayOfObjectToObject';
import useCreateWarehousingProvider from '../../modules/warehousing-providers/hooks/useCreateWarehousingProvider';
import useWarehousingInterfacesByType from '../../modules/warehousing-providers/hooks/useWarehousingInterfacesByType';
import useWarehousingProviderTypes from '../../modules/warehousing-providers/hooks/useWarehousingProviderTypes';
import { IWarehousingProviderType } from '../../gql/types';

const NewPaymentProvider = () => {
  const [selectedType, setSelectedType] = useState<IWarehousingProviderType>(
    IWarehousingProviderType.Physical,
  );
  const { formatMessage } = useIntl();
  const { createWarehousingProvider } = useCreateWarehousingProvider();
  const { warehousingProviderType } = useWarehousingProviderTypes();
  const { warehousingInterfaces } = useWarehousingInterfacesByType({
    providerType: selectedType,
  });
  const { hasRole } = useAuth();

  const onSubmit = async ({ adapterKey, type }) => {
    const { data, error } = await createWarehousingProvider({
      warehousingProvider: {
        adapterKey,
        type,
      },
    });
    if (error) return false;
    return { success: true, data: data?.createWarehousingProvider };
  };

  const router = useRouter();

  const onSubmitSuccess = (_, { _id }) => {
    router.replace(`/warehousing-provider?warehousingProviderId=${_id}`);
  };

  return (
    <>
      <BreadCrumbs />
      <div className="mx-auto sm:max-w-2xl">
        <PageHeader
          headerText={formatMessage({
            id: 'new_warehousing_provider_header',
            defaultMessage: 'New warehousing provider',
          })}
        />
        <div className="mt-6">
          <NewProviderForm
            readOnly={!hasRole(IRoleAction.ManageWarehousingProviders)}
            providerInterfaces={convertArrayOfObjectToObject(
              warehousingInterfaces,
              'label',
              'value',
            )}
            providerTypes={convertArrayOfObjectToObject(
              warehousingProviderType,
              'label',
              'value',
            )}
            onSubmit={onSubmit}
            onSubmitSuccess={onSubmitSuccess}
            onProviderChange={(current) => setSelectedType(current)}
          />
        </div>
      </div>
    </>
  );
};

export default NewPaymentProvider;
