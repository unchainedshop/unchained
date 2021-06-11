import React from 'react';
import { toast } from 'react-toastify';
import { compose, pure, mapProps, withHandlers, withState } from 'recompose';
import { Segment, Container, Menu } from 'semantic-ui-react';
import gql from 'graphql-tag';
import dynamic from 'next/dynamic';
import { graphql } from '@apollo/client/react/hoc';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import getConfig from 'next/config';
import FormTagInput from '../FormTagInput';
import withFormSchema from '../../lib/withFormSchema';
import withFormModel from '../../lib/withFormModel';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const { publicRuntimeConfig } = getConfig() || {};

const FormRTEInput = dynamic(import('../FormRTEInput'), {
  ssr: false,
});
const FormEditProductTexts = ({
  languages,
  changeSelectedLocale,
  activeLanguage,
  isEditingDisabled,
  ...formProps
}) => (
  <Container>
    <AutoForm {...formProps} disabled={isEditingDisabled}>
      <Menu attached="top" tabular>
        {languages.map((language) => (
          <Menu.Item
            key={`menu-item-${language._id}`}
            name={language.isoCode}
            active={activeLanguage === language.isoCode}
            onClick={changeSelectedLocale}
          >
            {language.name}
          </Menu.Item>
        ))}
      </Menu>
      <Segment attached="bottom">
        {languages.map((language, key) => (
          <div key={`form-${language.isoCode}`}>
            <AutoField
              name={`texts.${key}.locale`}
              disabled={isEditingDisabled}
              hidden
            />
            <AutoField
              name={`texts.${key}.slug`}
              disabled={isEditingDisabled}
              hidden={language.isoCode !== activeLanguage}
            />
            <AutoField
              name={`texts.${key}.title`}
              disabled={isEditingDisabled}
              hidden={language.isoCode !== activeLanguage}
            />
            <AutoField
              name={`texts.${key}.subtitle`}
              disabled={isEditingDisabled}
              hidden={language.isoCode !== activeLanguage}
            />
            <AutoField
              name={`texts.${key}.description`}
              disabled={isEditingDisabled}
              hidden={language.isoCode !== activeLanguage}
              component={FormRTEInput}
            />
            <AutoField
              name={`texts.${key}.vendor`}
              disabled={isEditingDisabled}
              hidden={language.isoCode !== activeLanguage}
            />
            <AutoField
              name={`texts.${key}.brand`}
              disabled={isEditingDisabled}
              hidden={language.isoCode !== activeLanguage}
            />
            <AutoField
              name={`texts.${key}.labels`}
              disabled={isEditingDisabled}
              hidden={language.isoCode !== activeLanguage}
              component={FormTagInput}
              options={[]}
            />
          </div>
        ))}
        <ErrorsField />
        <SubmitField
          value="Save"
          className="primary"
          disabled={isEditingDisabled}
        />
      </Segment>
    </AutoForm>
  </Container>
);

export default compose(
  graphql(gql`
    query productTexts($productId: ID!) {
      product(productId: $productId) {
        _id
        status
      }
      languages {
        _id
        isoCode
        isActive
        isBase
        name
      }
      translatedProductTexts(productId: $productId) {
        _id
        locale
        title
        subtitle
        slug
        description
        vendor
        brand
        labels
      }
    }
  `),
  mapProps(({ data, ...rest }) => {
    const { languages = [], product = {} /* translatedProductTexts = [] */ } =
      data;
    const filteredActiveLanguages = languages.filter(
      (language) => !!language.isBase
    );
    const baseLanguage =
      filteredActiveLanguages.length > 0
        ? filteredActiveLanguages[0].isoCode
        : publicRuntimeConfig.UNCHAINED_LANG;
    return {
      data,
      ...rest,
      languages,
      baseLanguage,
      isEditingDisabled: !product || product.status === 'DELETED',
    };
  }),
  withState('selectedLocale', 'setSelectedLocale', null),
  graphql(
    gql`
      mutation updateProductTexts(
        $texts: [UpdateProductTextInput!]!
        $productId: ID!
      ) {
        updateProductTexts(texts: $texts, productId: $productId) {
          _id
          locale
          title
          subtitle
          slug
          description
          vendor
          brand
          labels
        }
      }
    `,
    {
      options: {
        refetchQueries: ['productTexts', 'productInfos'],
      },
    }
  ),
  withFormSchema({
    texts: {
      type: Array,
      optional: true,
    },
    'texts.$': {
      type: Object,
      optional: true,
    },
    'texts.$.locale': {
      type: String,
      optional: false,
      label: 'Locale',
    },
    'texts.$.title': {
      type: String,
      optional: false,
      label: 'Title',
    },
    'texts.$.subtitle': {
      type: String,
      optional: true,
      label: 'Subtitle',
    },
    'texts.$.vendor': {
      type: String,
      optional: true,
      label: 'Vendor',
    },
    'texts.$.brand': {
      type: String,
      optional: true,
      label: 'Brand',
    },
    'texts.$.description': {
      type: String,
      optional: true,
      label: 'Product description',
    },
    'texts.$.slug': {
      type: String,
      optional: true,
      label: 'Slug',
    },
    'texts.$.labels': {
      type: Array,
      optional: true,
      label: 'Labels',
    },
    'texts.$.labels.$': {
      type: String,
      optional: true,
    },
  }),
  withFormModel(({ data: { translatedProductTexts = [] }, languages = [] }) => {
    const texts = languages.map((language) => {
      const foundTranslations = translatedProductTexts.filter(
        (translatedText) => translatedText.locale === language.isoCode
      );
      const localizedTextForLocale =
        foundTranslations.length > 0
          ? { ...foundTranslations[0] }
          : { locale: language.isoCode };
      localizedTextForLocale.labels = localizedTextForLocale.labels || [];
      return localizedTextForLocale;
    });
    return { texts };
  }),
  withHandlers({
    onSubmitSuccess: () => () => {
      toast('Texts saved', { type: toast.TYPE.SUCCESS });
    },
    changeSelectedLocale:
      ({ setSelectedLocale }) =>
      (event, element) => {
        setSelectedLocale(element.name);
      },
    onSubmit:
      ({ productId, mutate, schema }) =>
      ({ ...dirtyInput }) =>
        mutate({
          variables: {
            texts: schema.clean(dirtyInput).texts,
            productId,
          },
        }),
  }),
  withFormErrorHandlers,
  mapProps(
    ({
      setSelectedLocale,
      selectedLocale,
      baseLanguage,
      productId,
      mutate,
      data,
      ...rest
    }) => ({
      activeLanguage: selectedLocale || baseLanguage,
      ...rest,
    })
  ),
  pure
)(FormEditProductTexts);
