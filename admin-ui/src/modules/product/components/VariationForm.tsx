import { useIntl } from 'react-intl';
import Form from '../../forms/components/Form';
import TextField from '../../forms/components/TextField';
import Button from '../../common/components/Button';
import Badge from '../../common/components/Badge';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import useUpdateProductVariationTexts from '../hooks/useUpdateProductVariationTexts';
import useApp from '../../common/hooks/useApp';

const VariationForm = ({ variation, onCancel, onSuccess }) => {
  const { updateProductVariationTexts } = useUpdateProductVariationTexts();
  const { formatMessage } = useIntl();
  const { selectedLocale } = useApp();

  const onSubmit: OnSubmitType = async ({ title, subtitle }) => {
    await updateProductVariationTexts({
      productVariationId: variation._id,
      texts: [{ title, subtitle, locale: selectedLocale }],
    });
    onSuccess();
    return { success: true };
  };

  const form = useForm({
    submit: onSubmit,
    initialValues: {
      title: variation?.texts?.title ?? '',
      subtitle: variation?.texts?.subtitle ?? '',
    },
  });

  return (
    <Form
      form={form}
      className="variation-update-form bg-white dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700 w-full overflow-x-hidden overflow-y-visible relative hover:outline hover:outline-2 hover:outline-slate-400 dark:hover:outline-slate-500 transition-all"
      data-variationid={variation._id}
    >
      <div
        className="flex items-center justify-between w-full gap-4"
        tabIndex={-1}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0 overflow-hidden flex-wrap">
          <div className="flex-shrink-0 min-w-[180px]">
            <TextField
              className="mt-0 py-1"
              name="title"
              required
              label={formatMessage({
                id: 'title',
                defaultMessage: 'Title',
              })}
            />
          </div>

          {variation?.type && (
            <Badge
              text={variation.type}
              color="slate"
              className="rounded-md uppercase text-xs font-medium flex-shrink-0"
            />
          )}

          <div className="text-sm text-slate-500 dark:text-slate-400 truncate min-w-[200px]">
            <TextField
              className="mt-0 py-1"
              name="subtitle"
              label={formatMessage({
                id: 'subtitle',
                defaultMessage: 'Subtitle',
              })}
            />
          </div>

          {variation?.options?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {variation.options.map((option, index) => (
                <span
                  key={option.value || index}
                  className="inline-flex text-nowrap items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800"
                >
                  {option?.texts?.title || option.value}
                </span>
              ))}
            </div>
          )}

          <div className="text-sm text-slate-400 dark:text-slate-500 font-mono flex-shrink-0">
            ({variation?.key})
          </div>
        </div>

        <div className="flex space-x-2 flex-shrink-0">
          <Button
            onClick={onCancel}
            type="button"
            variant="secondary"
            size="sm"
            text={formatMessage({
              id: 'cancel',
              defaultMessage: 'Cancel',
            })}
          />
          <Button
            onClick={() => form.formik.submitForm()}
            type="submit"
            variant="primary"
            size="sm"
            text={formatMessage({
              id: 'save',
              defaultMessage: 'Save',
            })}
          />
        </div>
      </div>
    </Form>
  );
};

export default VariationForm;
