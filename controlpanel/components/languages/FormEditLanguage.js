import React from 'react';
import { toast } from 'react-toastify';
import { compose, mapProps, withHandlers } from 'recompose';
import { Segment, Button, Container } from 'semantic-ui-react';
import gql from 'graphql-tag';
import Router from 'next/router';
import { graphql } from 'react-apollo';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormModel from '../../lib/withFormModel';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormEditLanguage = ({ removeLanguage, ...formProps }) => (
  <Container>
    <AutoForm {...formProps} >
      <Segment attached="bottom">
        <AutoField name={'isoCode'} />
        <AutoField name={'isActive'} />
        <ErrorsField />
        <SubmitField value="Speichern" className="primary" />
        <Button type="normal" secondary floated="right" onClick={removeLanguage}>Löschen</Button>
      </Segment>
    </AutoForm>
  </Container>
);

export default compose(
  graphql(gql`
    query language($languageId: ID!) {
      language(languageId: $languageId) {
        _id
        isoCode
        isActive
        name
      }
    }
  `),
  graphql(gql`
    mutation updateLanguage($language: UpdateLanguageInput!, $languageId: ID!) {
      updateLanguage(language: $language, languageId: $languageId) {
        _id
        isoCode
        isActive
      }
    }
  `, {
    options: {
      refetchQueries: [
        'languages',
        'language',
      ],
    },
  }),
  graphql(gql`
    mutation removeLanguage($languageId: ID!) {
      removeLanguage(languageId: $languageId) {
        _id
      }
    }
  `, {
    name: 'removeLanguage',
    options: {
      refetchQueries: [
        'languages',
      ],
    },
  }),
  withFormSchema({
    isoCode: {
      type: String,
      optional: false,
      label: 'ISO Sprachcode',
    },
    isActive: {
      type: Boolean,
      optional: false,
      label: 'Aktiv',
    },
  }),
  withFormModel(({ data: { language = {} } }) => (language)),
  withHandlers({
    onSubmitSuccess: () => () => {
      toast('Texts saved to database', { type: toast.TYPE.SUCCESS });
    },
    removeLanguage: ({ languageId, removeLanguage }) => async (event) => {
      event.preventDefault();
      Router.replace({ pathname: '/languages' });
      await removeLanguage({
        variables: {
          languageId,
        },
      });
    },
    onSubmit: ({ languageId, mutate, schema }) => ({ ...dirtyInput }) => mutate({
      variables: {
        language: schema.clean(dirtyInput),
        languageId,
      },
    }),
  }),
  withFormErrorHandlers,
  mapProps(({
    languageId, mutate, data, ...rest
  }) => ({
    ...rest,
  })),
)(FormEditLanguage);
