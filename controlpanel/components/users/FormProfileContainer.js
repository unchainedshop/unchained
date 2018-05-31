import { compose, pure, mapProps, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';
import withFormSchema from '../../lib/withFormSchema';
import withFormModel from '../../lib/withFormModel';
import FormProfile from './FormProfile';

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
    onSubmit: ({ userId, mutate, schema }) => ({ ...dirtyInput }) =>
      mutate({
        variables: {
          userId,
          profile: schema.clean(dirtyInput),
        },
      }),
  }),
  withFormErrorHandlers,
  mapProps(({
    userId,
    error,
    schema,
    model,
    onSubmit,
    onChange,
    onSubmitSuccess,
    onSubmitFailure,
  }) => ({
    userId,
    error,
    schema,
    model,
    onSubmit,
    onChange,
    onSubmitSuccess,
    onSubmitFailure,
  })),
  pure,
)(FormProfile);
