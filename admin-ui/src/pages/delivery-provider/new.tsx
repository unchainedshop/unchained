import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import useAuth from '../../modules/Auth/useAuth';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';

import NewProviderForm from '../../modules/common/components/NewProviderForm';
import PageHeader from '../../modules/common/components/PageHeader';
import convertArrayOfObjectToObject from '../../modules/common/convertArrayOfObjectToObject';
import useCreateDeliveryProvider from '../../modules/delivery-provider/hooks/useCreateDeliveryProvider';
import useDeliveryInterfacesByType from '../../modules/delivery-provider/hooks/useDeliveryInterfacesByType';
import useDeliveryProviderTypes from '../../modules/delivery-provider/hooks/useDeliveryProviderTypes';
import { IDeliveryProviderType } from '../../gql/types';

const NewDeliveryProvider = () => {
  const [selectedType, setSelectedType] = useState<IDeliveryProviderType>(
    IDeliveryProviderType.Shipping,
  );
  const { formatMessage } = useIntl();
  const { createDeliveryProvider } = useCreateDeliveryProvider();
  const { deliveryProviderType } = useDeliveryProviderTypes();
  const { deliveryInterfaces } = useDeliveryInterfacesByType({
    providerType: selectedType,
  });
  const { hasRole } = useAuth();

  const onSubmit = async ({ adapterKey, type }) => {
    const { data, error } = await createDeliveryProvider({
      deliveryProvider: { adapterKey, type },
    });
    if (error) return false;
    return { success: true, data: data?.createDeliveryProvider };
  };

  const router = useRouter();

  const onSubmitSuccess = (_, { _id }) => {
    router.replace(`/delivery-provider?deliveryProviderId=${_id}`);
  };

  return (
    <>
      <BreadCrumbs />
      <div className="mx-auto sm:max-w-2xl">
        <PageHeader
          headerText={formatMessage({
            id: 'new_delivery_provider',
            defaultMessage: 'New delivery provider',
          })}
        />
        <div className="mt-6">
          <NewProviderForm
            readOnly={!hasRole('addDeliveryProvider')}
            providerInterfaces={convertArrayOfObjectToObject(
              deliveryInterfaces,
              'label',
              'value',
            )}
            providerTypes={convertArrayOfObjectToObject(
              deliveryProviderType,
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

export default NewDeliveryProvider;
