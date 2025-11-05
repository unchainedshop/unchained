import { useRouter } from 'next/router';
import { IRoleAction } from '../../gql/types';

import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

import FormWrapper from '../../modules/common/components/FormWrapper';
import CurrencyForm from '../../modules/currency/components/CurrencyForm';
import useCurrency from '../../modules/currency/hooks/useCurrency';
import useRemoveCurrency from '../../modules/currency/hooks/useRemoveCurrency';
import useUpdateCurrency from '../../modules/currency/hooks/useUpdateCurrency';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import PageHeader from '../../modules/common/components/PageHeader';
import useModal from '../../modules/modal/hooks/useModal';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import HeaderDeleteButton from '../../modules/common/components/HeaderDeleteButton';
import Loading from '../../modules/common/components/Loading';
import { normalizeCurrencyISOCode } from '../../modules/common/utils/utils';
import useAuth from '../../modules/Auth/useAuth';

const CurrencyDetailPage = ({ currencyId }) => {
  const { push } = useRouter();
  const { formatMessage, locale } = useIntl();
  const { hasRole } = useAuth();
  const { setModal } = useModal();

  const { currency, loading } = useCurrency({
    currencyId: currencyId as string,
  });
  const { updateCurrency } = useUpdateCurrency();
  const { removeCurrency } = useRemoveCurrency();
  const onSubmit = async ({ isActive, isoCode, contractAddress, decimals }) => {
    await updateCurrency({
      currencyId: currencyId as string,
      currency: { isActive, isoCode, contractAddress, decimals },
    });
    return true;
  };

  const onDelete = async () => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_currency_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this currency? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeCurrency({ currencyId: currencyId as string });
          toast.success(
            formatMessage({
              id: 'currency_deleted',
              defaultMessage: 'Currency deleted successfully',
            }),
          );
          push('/currency');
        }}
        okText={formatMessage({
          id: 'delete_currency',
          defaultMessage: 'Delete currency',
        })}
      />,
    );
  };

  return (
    <>
      <BreadCrumbs
        currentPageTitle={normalizeCurrencyISOCode(locale, currency?.isoCode)}
      />
      <div className="items-center flex min-w-full justify-between gap-3 flex-wrap">
        <PageHeader
          headerText={normalizeCurrencyISOCode(locale, currency?.isoCode)}
        />
        {hasRole(IRoleAction.ManageCurrencies) && (
          <HeaderDeleteButton onClick={onDelete} />
        )}
      </div>
      {loading ? (
        <Loading />
      ) : (
        <div className="mx-auto mt-6 sm:max-w-xl">
          <FormWrapper>
            <CurrencyForm onSubmit={onSubmit} defaultValue={currency} isEdit />
          </FormWrapper>
        </div>
      )}
    </>
  );
};

export default CurrencyDetailPage;
