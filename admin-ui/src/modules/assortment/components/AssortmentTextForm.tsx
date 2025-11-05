import { useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import Form from '../../forms/components/Form';

import SubmitButton from '../../forms/components/SubmitButton';
import TextField from '../../forms/components/TextField';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';

import useTranslatedAssortmentTexts from '../hooks/useTranslatedAssortmentTexts';
import useUpdateAssortmentTexts from '../hooks/useUpdateAssortmentTexts';
import SelfDocumentingView from '../../common/components/SelfDocumentingView';
import useAuth from '../../Auth/useAuth';
import FormWrapper from '../../common/components/FormWrapper';
import MarkdownTextAreaField from '../../forms/components/MarkdownTextAreaField';
import useApp from '../../common/hooks/useApp';
import useShopInfo from '../../common/hooks/useShopInfo';

const AssortmentTextForm = ({ assortmentId }) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { defaultLocale, shopInfo, loading: shopInfoLoading } = useShopInfo();
  const { selectedLocale, setSelectedLocale, languageDialectList } = useApp();

  const { translatedAssortmentTexts, loading } = useTranslatedAssortmentTexts({
    assortmentId,
  });

  const successMessage = formatMessage({
    id: 'saved',
    defaultMessage: 'Saved',
  });

  const { updateAssortmentTexts } = useUpdateAssortmentTexts();

  const onSubmit: OnSubmitType = async ({
    slug,
    title,
    subtitle,
    description,
  }) => {
    await updateAssortmentTexts({
      assortmentId,
      texts: [
        {
          locale: selectedLocale,
          slug,
          title,
          subtitle,
          description,
        },
      ],
    });
    return { success: true };
  };

  const form = useForm({
    submit: onSubmit,
    successMessage,
    initialValues: {
      slug: '',
      title: '',
      subtitle: '',
      ...((!loading &&
        translatedAssortmentTexts?.find(
          (text) => text.locale === selectedLocale,
        )) ||
        {}),
    },
  });

  useEffect(() => {
    const value = translatedAssortmentTexts?.find(
      (text) => text.locale === selectedLocale,
    );
    form.formik.setValues({
      slug: value?.slug || '',
      title: value?.title || '',
      subtitle: value?.subtitle || '',
      description: value?.description || '',
      ...(value || {}),
    });
  }, [translatedAssortmentTexts, selectedLocale]);

  useEffect(() => {
    if (shopInfo && translatedAssortmentTexts?.length) {
      if (
        translatedAssortmentTexts?.find(
          ({ locale }) => locale === selectedLocale,
        )
      ) {
        return;
      }
      if (
        defaultLocale &&
        translatedAssortmentTexts?.find(
          ({ locale }) => locale === defaultLocale,
        )
      ) {
        setSelectedLocale(defaultLocale);
      } else if (
        defaultLocale &&
        translatedAssortmentTexts?.find(
          ({ locale }) => locale === defaultLocale.split('-')[0],
        )
      ) {
        setSelectedLocale(defaultLocale.split('-')[0]);
      } else {
        const firstAvailableText = translatedAssortmentTexts?.find(
          ({ locale }) =>
            locale &&
            languageDialectList?.find(({ isoCode }) => isoCode === locale),
        );
        setSelectedLocale(firstAvailableText?.locale);
      }
    }
  }, [shopInfoLoading, translatedAssortmentTexts]);

  return (
    <SelfDocumentingView
      documentationLabel={formatMessage({
        id: 'texts',
        defaultMessage: 'Texts',
      })}
      className="mt-2 lg:mt-5"
      documentation={
        <FormattedMessage
          id="assortment_text_form_description"
          defaultMessage="<ul> <li><strong>Slug:</strong> The unique part of your category URL (e.g., 'electronics' or 'summer-collection'). Keep it short and descriptive.</li>
           <li><strong>Localization:</strong> Switch languages using the dropdown at the top left to translate content for different markets.</li>
           <li><strong>Description:</strong> Supports Markdown and HTML formatting. Use double backslash (\\\\\\\\) for line breaks.</li>
           <li><strong>Category Organization:</strong> Use clear, descriptive titles that help customers navigate your product catalog. Think about how customers would search for this category.</li>
           <li><strong>SEO Tip:</strong> Well-written category descriptions help search engines understand your product organization and improve discoverability.</li>
           </ul>"
          values={{
            ul: (chunk) => <ul className="space-y-2">{chunk} </ul>,
            li: (chunk) => (
              <li key={Math.random()} className="text-sm">
                {chunk}{' '}
              </li>
            ),
            strong: (chunk) => (
              <strong className="font-semibold text-slate-800 dark:text-slate-200">
                {chunk}
              </strong>
            ),
          }}
        />
      }
    >
      <FormWrapper>
        <Form form={form} disable={!hasRole('manageAssortments')}>
          <div className="shadow sm:rounded-md">
            <div className="grid gap-6 px-4 py-5 sm:p-6">
              <div className="col-span-12">
                <TextField
                  name="slug"
                  disable={!hasRole('manageAssortments')}
                  required
                  id="slug"
                  label={formatMessage({
                    id: 'slug',
                    defaultMessage: 'Slug',
                  })}
                  autoComplete="on"
                  className="mt-1 w-full text-sm"
                />
              </div>
              <div className="col-span-12">
                <TextField
                  name="title"
                  disable={!hasRole('manageAssortments')}
                  id="title"
                  label={formatMessage({
                    id: 'title',
                    defaultMessage: 'Title',
                  })}
                  required
                  autoComplete="on"
                  className="mt-1 w-full text-sm"
                />
              </div>
              <div className="col-span-12">
                <TextField
                  name="subtitle"
                  disable={!hasRole('manageAssortments')}
                  id="subtitle"
                  label={formatMessage({
                    id: 'subtitle',
                    defaultMessage: 'Subtitle',
                  })}
                  autoComplete="on"
                  className="mt-1 w-full text-sm"
                />
              </div>
              <div className="col-span-12">
                <MarkdownTextAreaField
                  name="description"
                  disable={!hasRole('manageAssortments')}
                  id="description"
                  label={formatMessage({
                    id: 'description',
                    defaultMessage: 'Description',
                  })}
                />
              </div>
            </div>

            <div className="border-t-slate-100 border-t dark:border-t-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-5 text-right sm:px-6">
              {hasRole('manageAssortments') && (
                <SubmitButton
                  label={formatMessage({
                    id: 'save',
                    defaultMessage: 'Save',
                  })}
                />
              )}
            </div>
          </div>
        </Form>
      </FormWrapper>
    </SelfDocumentingView>
  );
};

export default AssortmentTextForm;
