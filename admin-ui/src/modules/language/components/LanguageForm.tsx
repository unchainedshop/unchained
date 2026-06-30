import { useIntl } from 'react-intl';
import { IRoleAction } from '../../../gql/types';

import useAuth from '../../Auth/useAuth';
import Toggle from '@/components/ui/Toggle';
import Form from '../../forms/components/Form';
import SubmitButton from '@/components/ui/form/SubmitButton';
import TextField from '@/components/ui/form/TextField';
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
          disabled={!hasRole(IRoleAction.ManageLanguages)}
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
              disabled={!hasRole(IRoleAction.ManageLanguages)}
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
      {hasRole(IRoleAction.ManageLanguages) && (
        <div className="border-t-slate-100 border-t border-t-border-subtle mt-5 space-y-6 bg-surface-subtle p-5 text-right">
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
