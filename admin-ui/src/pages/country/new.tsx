import { useRouter } from 'next/router';

import { useIntl } from 'react-intl';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import FormWrapper from '../../modules/common/components/FormWrapper';
import PageHeader from '../../modules/common/components/PageHeader';
import CountryForm from '../../modules/country/components/CountryForm';
import useCreateCountry from '../../modules/country/hooks/useCreateCountry';

const AddCountries = () => {
  const { formatMessage } = useIntl();
  const { replace } = useRouter();
  const { createCountry } = useCreateCountry();
  const onCreateCountry = async ({ isoCode }) => {
    const { data, error } = await createCountry({ country: { isoCode } });
    if (error) return false;
    return { success: true, data: data?.createCountry };
  };

  const onSubmitSuccess = (_, { _id }) => {
    replace(`/country?countryId=${_id}`);
  };

  return (
    <>
      <BreadCrumbs />
      <div className="mx-auto sm:max-w-2xl">
        <PageHeader
          headerText={formatMessage({
            id: 'new_country_header',
            defaultMessage: 'New country',
          })}
        />
        <div className="mt-6 sm:max-w-xl">
          <FormWrapper>
            <CountryForm
              onSubmitSuccess={onSubmitSuccess}
              onSubmit={onCreateCountry}
            />
          </FormWrapper>
        </div>
      </div>
    </>
  );
};

export default AddCountries;
