import { useIntl } from 'react-intl';
import Form from '../../forms/components/Form';
import SubmitButton from '../../forms/components/SubmitButton';
import TextAreaField from '../../forms/components/TextAreaField';
import useForm, {
  OnSubmitSuccessType,
  OnSubmitType,
} from '../../forms/hooks/useForm';

const ProductReviewReportCommentForm = ({
  onSubmit,
  onSubmitSuccess = async () => true,
}: {
  onSubmit: OnSubmitType;
  onSubmitSuccess: OnSubmitSuccessType;
}) => {
  const { formatMessage } = useIntl();
  const successMessage = formatMessage({
    id: 'product_review_added',
    defaultMessage: 'Review added successfully!',
  });

  const form = useForm({
    submit: onSubmit,
    successMessage,
    onSubmitSuccess,
    initialValues: {
      message: '',
    },
  });
  return (
    <Form form={form}>
      <TextAreaField
        rows={3}
        required
        name="message"
        id="message"
        label={formatMessage({
          id: 'message',
          defaultMessage: 'Message',
        })}
      />
      <div className="-mx-6 -mb-6 mt-6 border-t-slate-100 border-t dark:border-t-slate-700 space-y-6 rounded-b-md bg-slate-50 dark:bg-slate-900 p-5 text-right">
        <SubmitButton
          label={formatMessage({
            id: 'report-submit',
            defaultMessage: 'Submit',
          })}
        />
      </div>
    </Form>
  );
};

export default ProductReviewReportCommentForm;
