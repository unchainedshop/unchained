import { FormattedMessage, useIntl } from 'react-intl';
import CopyableText from '../../common/components/CopyableText';
import Form from '../../forms/components/Form';
import SubmitButton from '../../forms/components/SubmitButton';
import MarkdownTextAreaField from '../../forms/components/MarkdownTextAreaField';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import useVerifyWeb3Address from '../hooks/useVerifyWeb3Address';

const SignWeb3AddressForm = ({ nonce, address, close }) => {
  const { formatMessage } = useIntl();
  const { verifyWeb3Address } = useVerifyWeb3Address();
  const successMessage = formatMessage({
    id: 'web3_verified_success',
    defaultMessage: 'Address verified successfully!',
  });

  const onVerifyAddress: OnSubmitType = async ({ hash }) => {
    await verifyWeb3Address({ hash, address });
    close();
    return { success: true };
  };
  const form = useForm({
    submit: onVerifyAddress,
    successMessage,
    enableReinitialize: true,

    getSubmitErrorMessage: (error) => {
      if (
        error?.message
          ?.toLowerCase()
          .includes('signature does not match web3 account')
      )
        form.formik.setFieldError(
          'hash',
          formatMessage({
            id: 'signature_not_match_error',
            defaultMessage: 'Signature does not match',
          }),
        );
      if (error?.message?.toLowerCase().includes('invalid signature length'))
        form.formik.setFieldError(
          'hash',
          formatMessage({
            id: 'invalid_signature_length',
            defaultMessage: 'Invalid signature',
          }),
        );

      return formatMessage({
        id: 'invalid_signature_length',
        defaultMessage: 'Invalid signature',
      });
    },
    initialValues: {
      hash: '',
    },
  });

  return (
    <div>
      <div className="border-b border-slate-300 bg-white mb">
        <div className="-ml-4 -mt-4 flex flex-wrap items-center justify-between sm:flex-nowrap">
          <div className="ml-4 mt-4">
            <h3 className="text-lg font-medium leading-6 text-slate-900">
              {formatMessage({
                id: 'sign_address_header',
                defaultMessage: 'Sign address',
              })}
            </h3>
            <p className="mt-1 text-sm text-slate-500 mb-4">
              <FormattedMessage
                id="web3_address_signature_instruction"
                defaultMessage="<p>Copy the following nonce <b> ({nonce})</b> and past the signature on the space        provided below </p>"
                values={{
                  p: (chunk) => <p>{chunk} </p>,
                  b: (chunk) => <b className="border-l text-2xl">{chunk} </b>,
                  nonce,
                }}
              />
            </p>
          </div>
          <div className="ml-4 mt-4 shrink-0">
            <CopyableText text={nonce} />
          </div>
        </div>
      </div>
      <Form form={form}>
        <MarkdownTextAreaField
          required
          name="hash"
          label={formatMessage({
            id: 'signature_hash',
            defaultMessage: 'Signature hash',
          })}
          placeholder={formatMessage({
            id: 'signature_hash',
            defaultMessage: 'Signature hash',
          })}
        />
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse justify-between">
          <SubmitButton
            label={formatMessage({
              id: 'register-with-web3',
              defaultMessage: 'Register',
            })}
          />
          <button
            id="danger_cancel"
            onClick={close}
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-700 shadow-xs hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
          </button>
        </div>
      </Form>
    </div>
  );
};

export default SignWeb3AddressForm;
