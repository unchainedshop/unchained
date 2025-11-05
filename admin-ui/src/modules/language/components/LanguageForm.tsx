import { useIntl } from 'react-intl';
import useAuth from '../../Auth/useAuth';
import Toggle from '../../common/components/Toggle';
import Form from '../../forms/components/Form';
import SubmitButton from '../../forms/components/SubmitButton';
import TextField from '../../forms/components/TextField';
import useForm from '../../forms/hooks/useForm';
import { validateLanguage } from '../../forms/lib/validators';

const LanguageForm = ({
  onSubmit,
  onSubmitSuccess = null,
  isEdit = false,
  defaultValue,
}) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const languageAddedMessage = formatMessage({
    id: 'language_added',
    defaultMessage: 'Language added successfully!',
  });
  const languageUpdatedMessage = formatMessage({
    id: 'language_updated',
    defaultMessage: 'Language updated successfully!',
  });
  const form = useForm({
    submit: onSubmit,
    onSubmitSuccess,
    successMessage: isEdit ? languageUpdatedMessage : languageAddedMessage,
    getSubmitErrorMessage: (error) => {
      if (error?.message?.includes('duplicate')) {
        form.formik.setFieldError(
          'isoCode',
          formatMessage({
            id: 'language_exists',
            defaultMessage: 'Language with the same ISO code already exists',
          }),
        );
        return '';
      }
    },
    enableReinitialize: true,
    initialValues: {
      isoCode: '',
      isActive: '',
      ...defaultValue,
    },
  });

  return (
    <Form form={form}>
      <div className="p-5">
        <TextField
          name="isoCode"
          disabled={!hasRole('manageLanguages')}
          id="isoCode"
          validators={[validateLanguage()]}
          label={formatMessage({
            id: 'iso_code',
            defaultMessage: 'ISO code',
          })}
          autoComplete="on"
          required
        />

        {isEdit && (
          <div className="mt-5 flex items-center flex-wrap">
            <Toggle
              toggleText={formatMessage({
                id: 'active',
                defaultMessage: 'Active',
              })}
              disabled={!hasRole('manageLanguages')}
              active={form.formik.values.isActive}
              onToggle={() =>
                form.formik.setFieldValue(
                  'isActive',
                  !form.formik.values.isActive,
                )
              }
            />
          </div>
        )}
      </div>
      {hasRole('manageLanguages') && (
        <div className="border-t-slate-100 border-t dark:border-t-slate-700 mt-5 space-y-6 bg-slate-50 dark:bg-slate-900 p-5 text-right">
          <SubmitButton
            label={
              isEdit
                ? formatMessage({
                    id: 'update_language',
                    defaultMessage: 'Update Language',
                  })
                : formatMessage({
                    id: 'add_language',
                    defaultMessage: 'Add Language',
                  })
            }
          />
        </div>
      )}
    </Form>
  );
};

export default LanguageForm;
