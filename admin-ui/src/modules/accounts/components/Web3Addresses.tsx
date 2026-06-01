import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

import Form from '../../forms/components/Form';
import SubmitButton from '@/components/ui/form/SubmitButton';
import TextField from '@/components/ui/form/TextField';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import useModal from '../../modal/hooks/useModal';
import DangerMessage from '../../modal/components/DangerMessage';

import ActiveInActive from '@/components/ui/ActiveInActive';
import Button from '@/components/ui/Button';
import { TrashIcon } from '@heroicons/react/20/solid';
import useRemoveWeb3Address from '../hooks/useRemoveWeb3Address';
import useAddWeb3Address from '../hooks/useAddWeb3Address';
import SignWeb3AddressForm from './SignWeb3AddressForm';

const Web3Addresses = ({ web3Addresses }) => {
  const { removeWeb3Address } = useRemoveWeb3Address();

  const { addWeb3Address } = useAddWeb3Address();
  const { formatMessage } = useIntl();
  const { setModal } = useModal();
  const onAddAddress: OnSubmitType = async ({ address }) => {
    await addWeb3Address({ address });
    return { success: true };
  };

  const validateWeb3Address = {
    isValid: (value) => value.match(/^0x/) && value.length === 42,
    intlMessageDescriptor: {
      id: 'invalid-web3-address',
      defaultMessage: 'Invalid {label} ',
    },
  };

  const onRemoveWeb3Address = async ({ address }) => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_web3_address_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this address? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeWeb3Address({ address });
          toast.success(
            formatMessage({
              id: 'web3_address_deleted',
              defaultMessage: 'Address deleted successfully',
            }),
          );
        }}
        okText={formatMessage({
          id: 'delete_web3_address',
          defaultMessage: 'Delete address?',
        })}
      />,
    );
  };

  const onVerifyAddress = async ({ address, nonce }) => {
    await setModal(
      <SignWeb3AddressForm
        address={address}
        nonce={nonce}
        close={async () => setModal('')}
      />,
    );
  };

  const successMessage = formatMessage({
    id: 'web3_address_added',
    defaultMessage: 'Address added successfully!',
  });
  const form = useForm({
    submit: onAddAddress,
    successMessage,
    enableReinitialize: true,
    initialValues: {
      address: '',
    },
  });

  return (
    <div className="rounded-md shadow-sm px-4 py-5 sm:p-6 bg-surface">
      <ul className="-my-5 divide-y divide-slate-200 dark:divide-slate-700">
        {(web3Addresses || []).map(({ address, verified, nonce }) => (
          <li className="py-4" key={address}>
            <div className="flex flex-wrap items-center justify-between">
              <div className="mr-2 flex max-w-md flex-wrap items-center space-x-2">
                <div className="truncate text-sm font-medium text-text-primary">
                  {address}
                </div>
                <ActiveInActive isActive={verified} />
              </div>
              <div className="my-1 flex items-center cursor-pointer">
                {!verified && (
                  <a
                    id="send_verification_mail"
                    onClick={async () => {
                      await onVerifyAddress({ address, nonce });
                    }}
                    className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-focus-ring focus:ring-offset-2"
                  >
                    {formatMessage({
                      id: 'verification_web3_address',
                      defaultMessage: 'Verify',
                    })}
                  </a>
                )}

                <Button
                  variant="danger"
                  size="xs"
                  rounded="full"
                  icon={<TrashIcon className="h-5 w-5" />}
                  onClick={() => onRemoveWeb3Address({ address })}
                  className="ml-2"
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Form form={form}>
        <div className="mt-4">
          <div className="items-between mt-4 flex space-x-4">
            <TextField
              className="mt-0"
              name="address"
              required
              validators={[validateWeb3Address]}
              label={formatMessage({
                id: 'web3_address',
                defaultMessage: 'Web3 Address',
              })}
            />
            <span className="shrink-0 flex items-end">
              <SubmitButton
                className="py-2 leading-5"
                label={formatMessage({
                  id: 'add_web3_address',
                  defaultMessage: 'Add address',
                })}
              />
            </span>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default Web3Addresses;
