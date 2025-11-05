import { useIntl } from 'react-intl';
import { IRoleAction } from '../../../gql/types';

import useAuth from '../../Auth/useAuth';
import Form from '../../forms/components/Form';

import SubmitButton from '../../forms/components/SubmitButton';
import TextField from '../../forms/components/TextField';
import useForm from '../../forms/hooks/useForm';
import TextAreaField from '../../forms/components/TextAreaField';

const ProductReviewForm = ({
  onSubmit,
  onSubmitSuccess = null,
  defaultValue = {},
  isEdit = false,
}) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();

  const reviewAddedMessage = formatMessage({
    id: 'product_review_added',
    defaultMessage: 'Review added successfully!',
  });
  const reviewUpdatedMessage = formatMessage({
    id: 'product_review_updated',
    defaultMessage: 'Review updated successfully!',
  });

  const form = useForm({
    submit: onSubmit,
    onSubmitSuccess,
    successMessage: isEdit ? reviewUpdatedMessage : reviewAddedMessage,
    initialValues: {
      title: '',
      review: '',
      rating: 1,
      ...defaultValue,
    },
  });
  return (
    <div className="bg-white dark:bg-slate-800 rounded-md shadow-sm overflow-hidden p-6 mb-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        {formatMessage({
          id: 'write_review',
          defaultMessage: 'Write a Review',
        })}
      </h3>
      <Form form={form}>
        <div className="space-y-4">
          <TextField
            name="title"
            disabled={!hasRole(IRoleAction.ReviewProduct)}
            id="title"
            label={formatMessage({
              id: 'title',
              defaultMessage: 'Title',
            })}
            autoComplete="off"
            required
          />

          <TextAreaField
            rows={4}
            name="review"
            disabled={!hasRole(IRoleAction.ReviewProduct)}
            id="review"
            label={formatMessage({
              id: 'review',
              defaultMessage: 'Review',
            })}
            placeholder={formatMessage({
              id: 'review_placeholder',
              defaultMessage: 'Share your thoughts about this product...',
            })}
          />
        </div>
        {hasRole(IRoleAction.ReviewProduct) && (
          <div className="mt-6 flex justify-end">
            <SubmitButton
              label={
                isEdit
                  ? formatMessage({
                      id: 'update_review',
                      defaultMessage: 'Update Review',
                    })
                  : formatMessage({
                      id: 'add_review',
                      defaultMessage: 'Add Review',
                    })
              }
              className="px-6 py-2"
            />
          </div>
        )}
      </Form>
    </div>
  );
};

export default ProductReviewForm;
