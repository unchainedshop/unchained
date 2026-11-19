import { CheckIcon } from '@heroicons/react/24/outline';
import { useIntl } from 'react-intl';
import SaveAndCancelButtons from '@/components/ui/SaveAndCancelButtons';
import Form from '../../forms/components/Form';
import CheckboxField from '@/components/ui/form/CheckboxField';
import JSONAreaField from '@/components/ui/form/JSONAreaField';
import TextField from '@/components/ui/form/TextField';
import useForm from '../../forms/hooks/useForm';
import {
  validateAmount,
  validatePositiveInteger,
} from '../../forms/lib/validators';

const QuotationConfigurationForm = ({
  successMessage,
  onSubmit,
  onCancel,
  icon = null,
  headerText,
  submitButtonText,
  withProposalFields = false,
  currencyDecimals = 2,
}) => {
  const { formatMessage } = useIntl();
  const defaultSuccessMessage = formatMessage({
    id: 'quotation_updated',
    defaultMessage: 'Quotation updated successfuly',
  });

  const form = useForm({
    submit: onSubmit,
    successMessage: successMessage ?? defaultSuccessMessage,
    onSubmitSuccess: onCancel,
    initialValues: {
      quotationContext: null,
      price: '',
      quantity: '',
      isNetPrice: false,
      isTaxable: true,
    },
  });
  return (
    <Form form={form} id="quotation_configuration">
      <div className="flex items-center text-center  mb-3">
        {icon || (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckIcon
              className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            />
          </div>
        )}

        <div className="text-center">
          <h3 className="text-lg text-text-primary" id="modal-title">
            {headerText}
          </h3>
        </div>
      </div>
      {withProposalFields && (
        <div className="mb-4 grid grid-cols-2 gap-4">
          <TextField
            name="price"
            label={formatMessage({ id: 'price', defaultMessage: 'Price' })}
            validators={[validateAmount(currencyDecimals)]}
          />
          <TextField
            name="quantity"
            validators={[validatePositiveInteger]}
            label={formatMessage({
              id: 'quantity',
              defaultMessage: 'Quantity',
            })}
          />
          <CheckboxField
            name="isNetPrice"
            label={formatMessage({
              id: 'net_price',
              defaultMessage: 'Net Price',
            })}
          />
          <CheckboxField
            name="isTaxable"
            label={formatMessage({ id: 'taxable', defaultMessage: 'Taxable' })}
          />
        </div>
      )}
      <div>
        <JSONAreaField
          name="quotationContext"
          required={false}
          label={formatMessage({
            id: 'quotation-context-input-label',
            defaultMessage: 'Quotation context',
          })}
          rows={10}
          labelClassName="text-sm font-medium text-slate-500 mb-2"
        />
      </div>
      <div className="border border-t-slate-100 bg-slate-50 mt-6 -mx-5 -mb-6 dark:bg-slate-500 dark:border-0">
        <SaveAndCancelButtons
          onCancel={onCancel}
          submitText={submitButtonText}
          className="justify-end "
        />
      </div>
    </Form>
  );
};

export default QuotationConfigurationForm;
