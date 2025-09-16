import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import useAuth from '../../modules/Auth/useAuth';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';

import NewProviderForm from '../../modules/common/components/NewProviderForm';
import PageHeader from '../../modules/common/components/PageHeader';
import convertArrayOfObjectToObject from '../../modules/common/convertArrayOfObjectToObject';
import useCreatePaymentProvider from '../../modules/payment-providers/hooks/useCreatePaymentProvider';
import usePaymentInterfacesByType from '../../modules/payment-providers/hooks/usePaymentInterfacesByType';
import usePaymentProviderTypes from '../../modules/payment-providers/hooks/usePaymentProviderTypes';
import { IPaymentProviderType } from '../../gql/types';

const NewPaymentProvider = () => {
  const [selectedType, setSelectedType] = useState<IPaymentProviderType>(
    IPaymentProviderType.Invoice,
  );
  const { formatMessage } = useIntl();

  const { createPaymentProvider } = useCreatePaymentProvider();
  const { paymentProviderType } = usePaymentProviderTypes();
  const { paymentInterfaces } = usePaymentInterfacesByType({
    providerType: selectedType,
  });
  const { hasRole } = useAuth();
  const onSubmit = async ({ adapterKey, type }) => {
    const { data, error } = await createPaymentProvider({
      paymentProvider: { adapterKey, type },
    });
    if (error) return false;
    return { success: true, data: data?.createPaymentProvider };
  };

  const router = useRouter();

  const onSubmitSuccess = (_, { _id }) => {
    router.replace(`/payment-provider?paymentProviderId=${_id}`);
  };

  return (
    <>
      <BreadCrumbs />
      <div className="mx-auto sm:max-w-2xl">
        <PageHeader
          headerText={formatMessage({
            id: 'new_payment_provider_header',
            defaultMessage: 'New payment provider',
          })}
        />
        <div className="mt-6">
          <NewProviderForm
            readOnly={!hasRole('addPaymentProvider')}
            providerInterfaces={convertArrayOfObjectToObject(
              paymentInterfaces,
              'label',
              'value',
            )}
            providerTypes={convertArrayOfObjectToObject(
              paymentProviderType,
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
