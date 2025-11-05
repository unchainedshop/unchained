import { useRouter } from 'next/router';
import { IRoleAction } from '../../gql/types';

import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import FormWrapper from '../../modules/common/components/FormWrapper';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import PageHeader from '../../modules/common/components/PageHeader';

import CountryForm from '../../modules/country/components/CountryForm';
import useCountry from '../../modules/country/hooks/useCountry';
import useRemoveCountry from '../../modules/country/hooks/useRemoveCountry';
import useUpdateCountry from '../../modules/country/hooks/useUpdateCountry';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import useModal from '../../modules/modal/hooks/useModal';
import HeaderDeleteButton from '../../modules/common/components/HeaderDeleteButton';
import Loading from '../../modules/common/components/Loading';
import { normalizeCountryISOCode } from '../../modules/common/utils/utils';
import useAuth from '../../modules/Auth/useAuth';

const normalizeCountry = (country) => {
  return {
    isActive: country?.isActive,
    isoCode: country?.isoCode,
  };
};

const CountryDetailPage = ({ countryId }) => {
  const { push } = useRouter();

  const { formatMessage, locale } = useIntl();
  const { setModal } = useModal();
  const { hasRole } = useAuth();

  const { country, loading } = useCountry({ countryId: countryId as string });
  const { updateCountry } = useUpdateCountry();
  const { removeCountry } = useRemoveCountry();

  const onSubmit = async ({ isActive, isoCode, defaultCurrencyCode }) => {
    await updateCountry({
      country: { isActive, isoCode, defaultCurrencyCode },
      countryId: countryId as string,
    });

    return true;
  };

  const onDelete = async () => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_country_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this country? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeCountry({ countryId: countryId as string });
          toast.success(
            formatMessage({
              id: 'country_deleted',
              defaultMessage: 'Country deleted successfully',
            }),
          );
          push('/country');
        }}
        okText={formatMessage({
          id: 'delete_country',
          defaultMessage: 'Delete country',
        })}
      />,
    );
  };

  return (
    <>
      <BreadCrumbs
        currentPageTitle={normalizeCountryISOCode(locale, country?.isoCode)}
      />
      <div className="items-center flex min-w-full justify-between gap-3 flex-wrap">
        <PageHeader
          headerText={normalizeCountryISOCode(locale, country?.isoCode)}
        />
        {hasRole(IRoleAction.ManageCountries) && (
          <HeaderDeleteButton onClick={onDelete} />
        )}
      </div>
      {loading ? (
        <Loading />
      ) : (
        <div className="mx-auto mt-6 sm:max-w-xl">
          <FormWrapper>
            <CountryForm
              isEdit
              defaultValue={normalizeCountry(country)}
              onSubmit={onSubmit}
            />
          </FormWrapper>
        </div>
      )}
    </>
  );
};

export default CountryDetailPage;
