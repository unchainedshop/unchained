import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import FormWrapper from '../../modules/common/components/FormWrapper';
import PageHeader from '../../modules/common/components/PageHeader';
import CurrencyForm from '../../modules/currency/components/CurrencyForm';
import useCreateCurrency from '../../modules/currency/hooks/useCreateCurrency';

const AddCurrency = () => {
  const { createCurrency } = useCreateCurrency();
  const router = useRouter();
  const { formatMessage } = useIntl();
  const onSubmitSuccess = (_, { _id }) => {
    router.replace(`/currency?currencyId=${_id}`);
  };

  const onSubmit = async ({ isoCode, contractAddress, decimals }) => {
    const { data, error } = await createCurrency({
      currency: { isoCode, contractAddress, decimals },
    });
    if (error) return false;
    return { success: true, data: data?.createCurrency };
  };
  return (
    <>
      <BreadCrumbs />

      <PageHeader
        headerText={formatMessage({
          id: 'new_currency_header',
          defaultMessage: 'New currency',
        })}
      />
      <div className="mt-6 lg:grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <FormWrapper>
            <CurrencyForm
              onSubmit={onSubmit}
              onSubmitSuccess={onSubmitSuccess}
            />
          </FormWrapper>
        </div>
        <div className="mt-10 lg:mt-44 lg:col-span-1">
          <div className="-my-5 divide-y divide-slate-200 dark:divide-slate-700 dark:text-slate-400 mr-4">
            {formatMessage({
              id: 'currency_contract_address_description',
              defaultMessage:
                'Contract address is optional and represents address of the 40 character long deployed token contract on the ethereum network. ',
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default AddCurrency;
