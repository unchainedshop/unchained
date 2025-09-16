import { CheckIcon } from '@heroicons/react/24/outline';
import { useIntl } from 'react-intl';
import SaveAndCancelButtons from '../../common/components/SaveAndCancelButtons';
import Form from '../../forms/components/Form';
import JSONAreaField from '../../forms/components/JSONAreaField';
import useForm from '../../forms/hooks/useForm';

const QuotationConfigurationForm = ({
  successMessage,
  onSubmit,
  onCancel,
  icon = null,
  headerText,
  submitButtonText,
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
          <h3
            className="text-lg text-slate-900 dark:text-slate-200"
            id="modal-title"
          >
            {headerText}
          </h3>
        </div>
      </div>
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
