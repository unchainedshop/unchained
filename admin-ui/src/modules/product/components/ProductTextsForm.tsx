import React, { useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import Form from '../../forms/components/Form';
import SubmitButton from '../../forms/components/SubmitButton';

import TextField from '../../forms/components/TextField';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import useTranslatedProductTexts from '../hooks/useTranslatedProductTexts';
import useUpdateProductTexts from '../hooks/useUpdateProductTexts';
import useAuth from '../../Auth/useAuth';
import FormWrapper from '../../common/components/FormWrapper';
import SelfDocumentingView from '../../common/components/SelfDocumentingView';

import MarkdownTextAreaField from '../../forms/components/MarkdownTextAreaField';
import TagInputField from '../../forms/components/TagInputField';
import HelpText from '../../common/components/HelpText';
import useApp from '../../common/hooks/useApp';
import useShopInfo from '../../common/hooks/useShopInfo';

const ProductTextsForm = ({
  productId,

  disabled = false,
}) => {
  const { selectedLocale, setSelectedLocale, languageDialectList } = useApp();
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { defaultLocale, shopInfo, loading: shopInfoLoading } = useShopInfo();
  const { translatedTexts } = useTranslatedProductTexts({ productId });
  const successMessage = formatMessage({
    id: 'saved',
    defaultMessage: 'Saved',
  });
  const { updateProductTexts } = useUpdateProductTexts();

  const onSubmit: OnSubmitType = async ({
    slug,
    title,
    subtitle,
    vendor,
    description,
    brand,
    labels,
  }) => {
    await updateProductTexts({
      productId,
      texts: [
        {
          locale: selectedLocale,
          slug,
          title,
          subtitle,
          vendor,
          description,
          brand,
          labels,
        },
      ],
    });
    return { success: true };
  };

  const form = useForm({
    disabled,
    submit: onSubmit,
    successMessage,
    initialValues: {
      slug: '',
      title: '',
      subtitle: '',
      vendor: '',
      description: '',
      brand: '',
      labels: [],
    },
  });

  useEffect(() => {
    const value = translatedTexts?.find(
      (text) => text.locale === selectedLocale,
    );
    form.formik.setValues({
      slug: '',
      title: '',
      subtitle: '',
      vendor: '',
      description: '',
      brand: '',
      labels: [],
      ...(value || {}),
    });
  }, [translatedTexts, selectedLocale]);
  useEffect(() => {
    if (shopInfo && translatedTexts?.length) {
      if (translatedTexts?.find(({ locale }) => locale === selectedLocale)) {
        return;
      }
      if (
        defaultLocale &&
        translatedTexts?.find(({ locale }) => locale === defaultLocale)
      ) {
        setSelectedLocale(defaultLocale);
      } else if (
        defaultLocale &&
        translatedTexts?.find(
          ({ locale }) => locale === defaultLocale.split('-')[0],
        )
      ) {
        setSelectedLocale(defaultLocale.split('-')[0]);
      } else {
        const firstAvailableText = translatedTexts?.find(
          ({ locale }) =>
            locale &&
            languageDialectList?.find(({ isoCode }) => isoCode === locale),
        );
        setSelectedLocale(firstAvailableText?.locale);
      }
    }
  }, [shopInfoLoading, translatedTexts]);

  return (
    <SelfDocumentingView
      documentationLabel={formatMessage({
        id: 'texts',
        defaultMessage: 'Texts',
      })}
      className="mt-2 lg:mt-5"
      documentation={
        <FormattedMessage
          id="product_text_form_description"
          defaultMessage="<ul> <li><strong>Slug:</strong> The unique part of your product URL (e.g., 'my-awesome-product'). Keep it short and descriptive.</li>
           <li><strong>Localization:</strong> Switch languages using the dropdown at the top left to translate content for different markets.</li>
           <li><strong>Description:</strong> Supports Markdown and HTML formatting. Use double backslash (\\\\) for line breaks.</li>
           <li><strong>Labels:</strong> Eye-catching badges that appear on your product (e.g., 'New Arrival', '50% Off', 'Limited Edition'). Perfect for promotions and highlighting special features. Each language can have unique labels.</li>
           <li><strong>Key Difference:</strong> Labels are customer-facing promotional badges, while Tags are internal keywords for organization and filtering.</li>
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
        <Form form={form}>
          <div className="relative text-slate-500 dark:text-slate-200 px-4 py-5 sm:p-6">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-3">
                <TextField
                  name="slug"
                  required
                  id="slug"
                  label={formatMessage({
                    id: 'slug',
                    defaultMessage: 'Slug',
                  })}
                  autoComplete="on"
                  className="text-sm"
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <TextField
                  name="title"
                  required
                  id="title"
                  label={formatMessage({
                    id: 'title',
                    defaultMessage: 'Title',
                  })}
                  autoComplete="on"
                  className="text-sm"
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <TextField
                  name="subtitle"
                  id="subtitle"
                  label={formatMessage({
                    id: 'subtitle',
                    defaultMessage: 'Subtitle',
                  })}
                  autoComplete="on"
                  className="text-sm"
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <TextField
                  name="vendor"
                  id="vendor"
                  label={formatMessage({
                    id: 'vendor',
                    defaultMessage: 'Vendor',
                  })}
                  autoComplete="on"
                  className="text-sm"
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <TextField
                  name="brand"
                  id="brand"
                  label={formatMessage({
                    id: 'brand',
                    defaultMessage: 'Brand',
                  })}
                  autoComplete="on"
                  className="text-sm"
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <TagInputField
                  name="labels"
                  id="labels"
                  label={formatMessage({
                    id: 'labels',
                    defaultMessage: 'Labels',
                  })}
                  placeholder={formatMessage({
                    id: 'label',
                    defaultMessage: 'Label',
                  })}
                  buttonText={formatMessage({
                    id: 'add',
                    defaultMessage: 'Add',
                  })}
                  autoComplete="on"
                  className="text-sm"
                />
                <HelpText
                  messageKey="product_labels_help"
                  defaultMessage="Add promotional badges like 'New Arrival', '50% Off', or 'Limited Edition' that customers will see on your product. Perfect for highlighting deals and special features."
                  className="mt-3"
                />
              </div>
            </div>
            <div className="col-span-6 mt-6 sm:col-span-3">
              <MarkdownTextAreaField
                name="description"
                id="description"
                label={formatMessage({
                  id: 'description',
                  defaultMessage: 'Description',
                })}
              />
            </div>
          </div>
          <div className="border-t-slate-100 border-t dark:border-t-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-5 text-right sm:px-6">
            <SubmitButton
              hidden={!hasRole('editProductTexts')}
              label={formatMessage({
                id: 'save',
                defaultMessage: 'Save',
              })}
            />
          </div>
        </Form>
      </FormWrapper>
    </SelfDocumentingView>
  );
};

export default ProductTextsForm;
