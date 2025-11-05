import { useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useAuth from '../../Auth/useAuth';
import FormWrapper from '../../common/components/FormWrapper';
import SelfDocumentingView from '../../common/components/SelfDocumentingView';
import convertArrayOfObjectToObject from '../../common/convertArrayOfObjectToObject';
import Form from '../../forms/components/Form';
import SelectField from '../../forms/components/SelectField';
import SubmitButton from '../../forms/components/SubmitButton';
import TextField from '../../forms/components/TextField';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import useProductTokenization from '../hooks/useProductTokenization';
import useSmartContractStandards from '../hooks/useSmartContractStandards';
import useUpdateProductTokenization from '../hooks/useUpdateProductTokenization';

const ProductTokenizationForm = ({ productId, disabled = false }) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { smartContractStandards } = useSmartContractStandards();
  const { updateProductTokenization } = useUpdateProductTokenization();
  const { product, loading } = useProductTokenization({ productId });

  const onSubmit: OnSubmitType = async ({
    contractAddress,
    contractStandard,
    tokenId,
    supply,
  }) => {
    await updateProductTokenization({
      productId,
      tokenization: {
        contractAddress,
        contractStandard,
        tokenId: tokenId || '',
        supply,
      },
    });
    return { success: true };
  };

  const successMessage = formatMessage({
    id: 'token_updated',
    defaultMessage: 'Token update successfully!',
  });

  const form = useForm({
    disabled,
    submit: onSubmit,
    successMessage,
    initialValues: {
      contractAddress: '',
      contractStandard: '',
      tokenId: '',
      supply: '',
    },
  });

  useEffect(() => {
    if (!loading)
      form.formik.setValues({
        contractAddress: product?.contractAddress || '',
        contractStandard: product?.contractStandard || '',
        tokenId: product?.contractConfiguration?.tokenId || '',
        supply: product?.contractConfiguration?.supply || '',
      });
  }, [loading]);

  return (
    <SelfDocumentingView
      documentationLabel={formatMessage({
        id: 'texts',
        defaultMessage: 'Texts',
      })}
      className="mt-2 lg:mt-5"
      documentation={
        <FormattedMessage
          id="tokenized_product_text_form_description"
          defaultMessage="<b>Contract standards </b> <ol> 
          <dt><b> ERC721 </b></dt> <dd> Buying multiple Products leads to multiple Tokens (make sure to set the tokenId to 0 to make it auto generate new id's)  </dd>
            <dt> <b> ERC1155 </b></dt> <dd> Buying multiple Products leads to a new token with balance 3 of token with tokenId assigned </dd>
            <dt> <b> Contract address </b></dt> <dd> Address of a token on a given network </dd> </ol>"
          values={{
            ol: (chunk) => <ol>{chunk} </ol>,
            dt: (chunk) => <dt className="bold">{chunk} </dt>,
            dd: (chunk) => <dd>{chunk} </dd>,
            b: (chunk) => <b>{chunk} </b>,
          }}
        />
      }
    >
      <FormWrapper>
        <Form form={form}>
          <div className="p-5 pb-7 sm:max-w-full flex flex-col gap-y-5">
            <SelectField
              className="w-full"
              label={formatMessage({
                id: 'contract-standard',
                defaultMessage: 'Contract standard',
              })}
              placeholder={formatMessage({
                id: 'contract-standard',
                defaultMessage: 'Contract standard',
              })}
              required
              name="contractStandard"
              options={convertArrayOfObjectToObject(
                smartContractStandards,
                'label',
                'value',
              )}
            />
            <TextField
              name="contractAddress"
              id="contractAddress"
              label={formatMessage({
                id: 'contract-address-label',
                defaultMessage: 'Contract Address',
              })}
              placeholder={formatMessage({
                id: 'contract-address-label',
                defaultMessage: 'Contract Address',
              })}
              required
              className="block w-full max-w-full rounded-md border-slate-300 dark:border-slate-800 text-sm  focus:ring-slate-800 sm:text-sm"
            />
            <TextField
              name="supply"
              id="supply"
              type="number"
              label={formatMessage({
                id: 'token-supply',
                defaultMessage: 'Supply',
              })}
              placeholder={formatMessage({
                id: 'token-supply',
                defaultMessage: 'Supply',
              })}
              required
              className="block w-full max-w-full rounded-md border-slate-300 dark:border-slate-800 text-sm  focus:ring-slate-800 sm:text-sm"
            />
            <TextField
              name="tokenId"
              id="tokenId"
              label={formatMessage({
                id: 'token-id-label',
                defaultMessage: 'Token Serial Number',
              })}
              placeholder={formatMessage({
                id: 'token-id-label',
                defaultMessage: 'Token Serial Number',
              })}
              className="block w-full max-w-full rounded-md border-slate-300 dark:border-slate-800 text-sm  focus:ring-slate-800 sm:text-sm"
            />
          </div>

          {hasRole('manageProducts') && (
            <div className="space-y-6 border-t border-t-slate-100 dark:border-t-slate-700 bg-slate-50 dark:bg-slate-900 p-5 text-right">
              <SubmitButton
                label={formatMessage({
                  id: 'update_token',
                  defaultMessage: 'Update token',
                })}
              />
            </div>
          )}
        </Form>
      </FormWrapper>
    </SelfDocumentingView>
  );
};

export default ProductTokenizationForm;
