import { useIntl } from 'react-intl';
import Form from '../../forms/components/Form';
import TagInputField from '../../forms/components/TagInputField';
import useForm from '../../forms/hooks/useForm';
import SaveAndCancelButtons from './SaveAndCancelButtons';

const TagListForm = ({ tags, onSubmit, onCancel }) => {
  const { formatMessage } = useIntl();
  const successMessage = formatMessage({
    id: 'tags_updated',
    defaultMessage: 'Tags updated successfully',
  });

  const form = useForm({
    submit: onSubmit,
    successMessage,
    onSubmitSuccess: onCancel,
    initialValues: {
      tags,
    },
  });
  return (
    <Form form={form} id="add_tag_form">
      <div>
        <TagInputField
          name="tags"
          id="tags"
          label={formatMessage({ id: 'tags', defaultMessage: 'Tags' })}
          tagList={tags}
        />
      </div>
      <div className="border border-t-slate-100 bg-slate-50 mt-6 -mx-6 -mb-6 px-6 dark:bg-slate-900 dark:border-0">
        <SaveAndCancelButtons onCancel={onCancel} className="justify-end " />
      </div>
    </Form>
  );
};

export default TagListForm;
