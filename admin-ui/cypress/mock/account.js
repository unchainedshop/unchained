export const ChangePasswordResponse = {
  data: {
    changePassword: {
      success: true,
      __typename: 'SuccessResponse',
    },
  },
};
export const AccountOperations = {
  CurrentUser: 'CurrentUser',
  UpdateUserProfile: 'UpdateUserProfile',
  ChangePassword: 'ChangePassword',
  SendVerificationEmail: 'SendVerificationEmail',
  RemoveEmail: 'RemoveEmail',
  AddEmail: 'AddEmail',
};
