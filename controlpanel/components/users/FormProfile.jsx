import React from 'react';
import {
  compose, pure, mapProps, withHandlers,
} from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { Grid, Segment, Divider } from 'semantic-ui-react';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import PhoneField from '../FormPhoneInput';
import DateField from '../FormDateInput';
import UploadAvatar from './UploadAvatar';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';
import withFormSchema from '../../lib/withFormSchema';
import withFormModel from '../../lib/withFormModel';

const FormProfile = ({
  userId,
  error,
  schema,
  model,
  onSubmit,
  onChange,
  onSubmitSuccess,
  onSubmitFailure,
}) => (
  <Segment>
    <AutoForm
      showInlineError
      {...({
        error,
        schema,
        model,
        onSubmit,
        onChange,
        onSubmitSuccess,
        onSubmitFailure,
      })}
    >
      <Grid stackable columns={4}>
        <Grid.Row columns={1}>
          <Grid.Column textAlign="center">
            <Segment basic>
              <UploadAvatar userId={userId} />
            </Segment>
            <Divider />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row columns={1}>
          <Grid.Column width={16}>
            <AutoField name="displayName" />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row columns={4}>
          <Grid.Column width={4}>
            <AutoField name="gender" />
          </Grid.Column>
          <Grid.Column width={4}>
            <AutoField name="birthday" component={DateField} />
          </Grid.Column>
          <Grid.Column width={8}>
            <AutoField name="phoneMobile" component={PhoneField} country="CH" />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row columns={1}>
          <Grid.Column width={16}>
            <label htmlFor="address.firstName">
              Address
            </label>
            <Segment>
              <Grid stackable columns={1}>
                <Grid.Row columns={2}>
                  <Grid.Column width={8}>
                    <AutoField name="address.firstName" />
                  </Grid.Column>
                  <Grid.Column width={8}>
                    <AutoField name="address.lastName" />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row columns={1}>
                  <Grid.Column width={16}>
                    <AutoField name="address.company" />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row columns={1}>
                  <Grid.Column width={16}>
                    <AutoField name="address.addressLine" />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row columns={1}>
                  <Grid.Column width={16}>
                    <AutoField name="address.addressLine2" />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row columns={4}>
                  <Grid.Column width={4}>
                    <AutoField name="address.regionCode" />
                  </Grid.Column>
                  <Grid.Column width={4}>
                    <AutoField name="address.postalCode" />
                  </Grid.Column>
                  <Grid.Column width={8}>
                    <AutoField name="address.city" />
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </Segment>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row columns={2}>
          <Grid.Column width={8}>
            <ErrorsField />
            <SubmitField value="Save" className="primary" />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </AutoForm>
  </Segment>
);

export const PROFILE = 'PROFILE';

const FRAGMENT_PROFILE = gql`
  fragment profileFields on User {
    _id
    profile {
      displayName
      phoneMobile
      birthday
      gender
      address {
        firstName
        lastName
        company
        addressLine
        addressLine2
        postalCode
        countryCode
        regionCode
        city
      }
    }
  }
`;

export default compose(
  graphql(gql`
    query getProfile($userId: ID) {
      user(userId: $userId) {
        ...profileFields
      }
    }
    ${FRAGMENT_PROFILE}
  `),
  graphql(gql`
    mutation updateUserProfile($profile: UserProfileInput!, $userId: ID) {
      updateUserProfile(profile: $profile, userId: $userId) {
        name
        ...profileFields
      }
    }
    ${FRAGMENT_PROFILE}
  `),
  withFormSchema({
    displayName: {
      type: String,
      optional: false,
      label: 'Anzeigename',
    },
    birthday: {
      type: Date,
      optional: true,
      label: 'Birthday',
    },
    phoneMobile: {
      type: String,
      optional: true,
      label: 'Mobile phone',
    },
    tags: {
      type: Array,
      optional: true,
      label: 'Tags (Kundensegmentierung)',
    },
    'tags.$': String,
    gender: {
      type: String,
      optional: true,
      label: 'Gender',
      uniforms: {
        options: [
          { label: 'Unspecified', value: 'u' },
          { label: 'Company', value: 'c' },
          { label: 'Male', value: 'm' },
          { label: 'Female', value: 'f' },
        ],
      },
    },
    address: {
      type: Object,
      optional: true,
      label: 'Legal Address',
    },
    'address.firstName': {
      type: String,
      optional: true,
      label: 'Firstname',
    },
    'address.lastName': {
      type: String,
      optional: true,
      label: 'Lastname',
    },
    'address.company': {
      type: String,
      optional: true,
      label: 'Company',
    },
    'address.addressLine': {
      type: String,
      optional: true,
      label: 'Address line 1 (Street, Houseno)',
    },
    'address.addressLine2': {
      type: String,
      optional: true,
      label: 'Address line 2',
    },
    'address.postalCode': {
      type: String,
      optional: true,
      label: 'Postal/ZIP',
    },
    'address.countryCode': {
      type: String,
      optional: true,
      label: 'Country Code',
    },
    'address.regionCode': {
      type: String,
      optional: true,
      label: 'Region Code',
    },
    'address.city': {
      type: String,
      optional: true,
      label: 'City/Commune',
    },
  }),
  withFormModel(({ data: { user } }) => (user && user.profile) || {}),
  withHandlers({
    onSubmit: ({ userId, mutate, schema }) => ({ ...dirtyInput }) => mutate({
      variables: {
        userId,
        profile: schema.clean(dirtyInput),
      },
    }),
  }),
  withFormErrorHandlers,
  pure,
)(FormProfile);
