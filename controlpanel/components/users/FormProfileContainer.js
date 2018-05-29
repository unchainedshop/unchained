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
      firstName
      lastName
      phoneMobile
      birthday
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
    firstName: {
      type: String,
      optional: false,
      label: 'Vorname',
    },
    lastName: {
      type: String,
      optional: false,
      label: 'Nachname',
    },
    birthday: {
      type: Date,
      optional: true,
      label: 'Geburtsdatum',
    },
    phoneMobile: {
      type: String,
      optional: true,
      label: 'Mobiltelefonnummer',
    },
    tags: {
      type: Array,
      optional: true,
      label: 'Tags (Kundensegmentierung)',
    },
    'tags.$': String,
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
