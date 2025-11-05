import React, { useEffect } from 'react';
import { IRoleAction } from '../../../gql/types';

import { FormattedMessage, useIntl } from 'react-intl';

import Form from '../../forms/components/Form';

import SubmitButton from '../../forms/components/SubmitButton';
import TextField from '../../forms/components/TextField';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import useUpdateFilterTexts from '../hooks/useUpdateFilterTexts';
import useTranslatedFilterTexts from '../hooks/useTranslatedFilterTexts';
import SelfDocumentingView from '../../common/components/SelfDocumentingView';
import useAuth from '../../Auth/useAuth';
import FormWrapper from '../../common/components/FormWrapper';
import useApp from '../../common/hooks/useApp';

const FilterTextForm = ({ filterId }) => {
  const { formatMessage } = useIntl();
  const { selectedLocale } = useApp();
  const { translatedFilterTexts, loading } = useTranslatedFilterTexts({
    filterId,
  });
  const { hasRole } = useAuth();
  const successMessage = formatMessage({
    id: 'saved',
    defaultMessage: 'Saved',
  });

  const { updateFilterTexts } = useUpdateFilterTexts();

  const onSubmit: OnSubmitType = async ({ title, subtitle }) => {
    await updateFilterTexts({
      filterId,
      texts: [
        {
          locale: selectedLocale,
          title,
          subtitle,
        },
      ],
    });
    return { success: true };
  };

  const form = useForm({
    submit: onSubmit,
    successMessage,
    initialValues: {
      title: '',
      subtitle: '',
      ...((!loading &&
        translatedFilterTexts?.find(
          (text) => text.locale === selectedLocale,
        )) ||
        {}),
    },
  });

  useEffect(() => {
    const value = translatedFilterTexts?.find(
      (text) => text.locale === selectedLocale,
    );
    form.formik.setValues({ title: '', subtitle: '', ...(value || {}) });
  }, [translatedFilterTexts, selectedLocale]);

  return (
    <SelfDocumentingView
      documentationLabel={formatMessage({
        id: 'text',
        defaultMessage: 'Text',
      })}
      documentation={
        <FormattedMessage
          id="filter_text_form_description"
          defaultMessage="<ul> <li>You can change the language of filter using the dropdown found at top left corner</li>
        </ul>"
          values={{
            ul: (chunk) => <ul className="space-y-1">{chunk} </ul>,
            li: (chunk) => <li>{chunk} </li>,
          }}
        />
      }
    >
      <FormWrapper>
        <Form
          form={form}
          className="border-slate-300 dark:border-slate-800 pt-2 lg:shadow-sm"
        >
          <div>
            <TextField
              name="title"
              id="title"
              label={formatMessage({
                id: 'title',
                defaultMessage: 'Title',
              })}
              autoComplete="on"
              className="mt-2 px-4 text-sm"
            />
          </div>

          <div>
            <TextField
              name="subtitle"
              id="subtitle"
              label={formatMessage({
                id: 'subtitle',
                defaultMessage: 'Subtitle',
              })}
              autoComplete="on"
              className="mt-5 px-4 text-sm"
            />
          </div>

          {hasRole(IRoleAction.ManageFilters) && (
            <div className="flex bg-slate-100 dark:bg-slate-900 mt-5">
              <SubmitButton
                label={formatMessage({
                  id: 'update_filter',
                  defaultMessage: 'Update filter',
                })}
                className="my-4 ml-auto mr-4"
              />
            </div>
          )}
        </Form>
      </FormWrapper>
    </SelfDocumentingView>
  );
};

export default FilterTextForm;
