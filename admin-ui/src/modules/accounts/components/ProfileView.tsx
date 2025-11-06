import React, { useEffect, useRef, useState } from 'react';
import { IRoleAction } from '../../../gql/types';

import { useIntl } from 'react-intl';
import DatePickerField from '../../forms/components/DatePickerField';
import Form from '../../forms/components/Form';
import SelectField from '../../forms/components/SelectField';
import TextField from '../../forms/components/TextField';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import useUpdateUserAvatar from '../hooks/useUpdateUserAvatar';
import useUpdateUserProfile from '../hooks/useUpdateUserProfile';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import SaveAndCancelButtons from '../../common/components/SaveAndCancelButtons';
import AddressFields from './AddressFields';
import { UserCircleIcon } from '@heroicons/react/24/outline';

import useAuth from '../../Auth/useAuth';
import FormWrapper from '../../common/components/FormWrapper';
import useCurrentUser from '../hooks/useCurrentUser';
import ImageWithFallback from '../../common/components/ImageWithFallback';
import { validateBirthdate } from '../../forms/lib/validators';

const ProfileView = ({ profile, avatar, _id }) => {
  const { address } = profile || {};
  const fileInputRef = useRef(undefined);
  const { formatMessage } = useIntl();
  const { currentUser } = useCurrentUser();
  const { formatDateTime } = useFormatDateTime();
  const { updateUserProfile } = useUpdateUserProfile();
  const { updateUserAvatar } = useUpdateUserAvatar();
  const { hasRole } = useAuth();

  const [isEdit, setIsEdit] = useState(false);
  const onUpdateProfile: OnSubmitType = async (updatedProfile) => {
    const { displayName, phoneMobile, birthday, gender } = updatedProfile;
    const {
      firstName,
      lastName,
      company,
      addressLine,
      addressLine2,
      postalCode,
      regionCode,
      countryCode,
      city,
    } = updatedProfile;

    const result = await updateUserProfile({
      profile: {
        displayName,
        phoneMobile,
        birthday,
        gender,
        address: {
          firstName,
          lastName,
          company,
          addressLine,
          addressLine2,
          postalCode,
          regionCode,
          countryCode,
          city,
        },
      },
      userId: _id,
    });
    setIsEdit(false);
    return { success: true, data: result };
  };

  const onUpdateAvatar = async ({ target }) => {
    const [file] = target.files;
    await updateUserAvatar({
      userId: _id,
      avatar: file,
    });

    return true;
  };

  const successMessage = formatMessage({
    id: 'profile_updated',
    defaultMessage: 'Profile updated successfully!',
  });

  const form = useForm({
    submit: onUpdateProfile,
    successMessage,
    initialValues: {
      birthday: null,
      displayName: null,
      gender: null,
      phoneMobile: null,
      firstName: null,
      lastName: null,
      city: null,
      company: null,
      addressLine: null,
      addressLine2: null,
      postalCode: null,
      countryCode: null,
      regionCode: null,
    },
  });

  useEffect(() => {
    if (Object.keys(profile || {}).length) {
      form.formik.setValues({
        birthday: profile?.birthday ? new Date(profile?.birthday) : null,
        displayName: profile?.displayName,
        gender: profile?.gender,
        phoneMobile: profile?.phoneMobile,
        firstName: address?.firstName,
        lastName: address?.lastName,
        city: address?.city,
        company: address?.company,
        addressLine: address?.addressLine,
        addressLine2: address?.addressLine2,
        postalCode: address?.postalCode,
        countryCode: address?.countryCode,
        regionCode: address?.regionCode,
      });
    }
  }, [profile]);
  return (
    <FormWrapper className="shadow-none">
      <Form form={form}>
        <div className="overflow-hidden rounded-md bg-slate-50 dark:bg-slate-950">
          <div className="lg:grid lg:grid-cols-3">
            <div className="mb-5 lg:col-span-1 lg:pr-5">
              <div className="space-y-2">
                <h3 className="text-lg text-slate-900 dark:text-slate-200">
                  {formatMessage({
                    id: 'profile',
                    defaultMessage: 'Profile',
                  })}
                </h3>
                <p className="mt-3 divide-y divide-slate-200 text-slate-600 dark:divide-slate-700 dark:text-slate-400 mr-4">
                  {formatMessage({
                    id: 'profile_notice',
                    defaultMessage:
                      'This information will be displayed publicly so be careful what you share.',
                  })}
                </p>
              </div>
              {(hasRole(IRoleAction.UpdateUser) ||
                currentUser?._id === _id) && (
                <SaveAndCancelButtons
                  showSubmit={isEdit}
                  onCancel={() => setIsEdit(!isEdit)}
                  showCancel
                  cancelText={
                    isEdit
                      ? formatMessage({
                          id: 'cancel',
                          defaultMessage: 'Cancel',
                        })
                      : formatMessage({
                          id: 'update_profile',
                          defaultMessage: 'Update profile / address',
                        })
                  }
                />
              )}
            </div>

            <div className="col-span-2 ml-auto rounded-md px-6 shadow-sm dark:shadow-none lg:w-full bg-white dark:bg-slate-800">
              <div className="py-4">
                <div className="py-4 sm:grid sm:py-2">
                  <label className="text-sm text-slate-400 dark:text-slate-200">
                    {formatMessage({
                      id: 'photo',
                      defaultMessage: 'Photo',
                    })}
                  </label>
                  <div className="mt-2 flex items-center space-x-5 text-sm sm:col-span-2">
                    <span className="">
                      <input
                        onChange={onUpdateAvatar}
                        multiple={false}
                        ref={fileInputRef}
                        type="file"
                        hidden
                      />
                      {avatar ? (
                        <ImageWithFallback
                          key={avatar?.url}
                          src={avatar?.url}
                          width={100}
                          height={100}
                          alt={formatMessage({
                            id: 'unchained_logo',
                            defaultMessage: 'Unchained Logo',
                          })}
                        />
                      ) : (
                        <span className="inline-block h-12 w-12 overflow-hidden rounded-full">
                          <UserCircleIcon className="h-full w-full text-slate-800 dark:text-slate-500" />
                        </span>
                      )}
                    </span>
                    {hasRole(IRoleAction.UploadUserAvatar) && (
                      <span className="mt-1 ml-4 flex shrink-0 items-start space-x-4">
                        <button
                          onClick={() => {
                            if ((fileInputRef?.current as any)?.click)
                              (fileInputRef?.current as any)?.click();
                          }}
                          type="button"
                          className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-600 py-2 px-3 text-sm font-medium leading-4 text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                        >
                          {formatMessage({
                            id: 'change',
                            defaultMessage: 'Change',
                          })}
                        </button>
                      </span>
                    )}
                  </div>
                </div>

                <div className="py-4 sm:grid sm:py-2">
                  <label className="text-sm text-slate-400 dark:text-slate-200">
                    {!isEdit &&
                      formatMessage({
                        id: 'displayName',
                        defaultMessage: 'Display Name',
                      })}
                  </label>
                  <div className="mt-1 flex text-sm text-slate-900 dark:text-slate-200 sm:mt-0">
                    {isEdit ? (
                      <TextField
                        className="mt-0 w-full"
                        name="displayName"
                        label={formatMessage({
                          id: 'displayName',
                          defaultMessage: 'Display Name',
                        })}
                      />
                    ) : (
                      <span className="grow">{profile?.displayName}</span>
                    )}
                  </div>
                </div>

                <div className="py-4 sm:grid sm:py-2">
                  <label className="text-sm text-slate-400 dark:text-slate-200">
                    {!isEdit &&
                      formatMessage({
                        id: 'gender',
                        defaultMessage: 'Gender',
                      })}
                  </label>
                  <div className="mt-1 flex text-sm text-slate-900 dark:text-slate-200 sm:mt-0">
                    {isEdit ? (
                      <SelectField
                        className="mt-0 w-full"
                        label={formatMessage({
                          id: 'gender',
                          defaultMessage: 'Gender',
                        })}
                        name="gender"
                        options={{
                          M: formatMessage({
                            id: 'male',
                            defaultMessage: 'Male',
                          }),
                          F: formatMessage({
                            id: 'female',
                            defaultMessage: 'Female',
                          }),
                        }}
                      />
                    ) : (
                      <span className="grow">{profile?.gender || 'n/a'}</span>
                    )}
                  </div>
                </div>

                <div className="py-4 sm:grid sm:py-2">
                  <label className="text-sm text-slate-400 dark:text-slate-200">
                    {!isEdit &&
                      formatMessage({
                        id: 'birthday',
                        defaultMessage: 'Birthday',
                      })}
                  </label>
                  <div className="mt-1 flex text-sm text-slate-900 dark:text-slate-200 sm:mt-0">
                    {isEdit ? (
                      <DatePickerField
                        label={formatMessage({
                          id: 'birthday',
                          defaultMessage: 'Birthday',
                        })}
                        className="mt-0 w-full"
                        name="birthday"
                        validators={[validateBirthdate]}
                      />
                    ) : (
                      <span className="grow">
                        {formatDateTime(profile?.birthday, {
                          dateStyle: 'short',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="py-4 sm:grid sm:py-2">
                  <label className="text-sm text-slate-400 dark:text-slate-200">
                    {!isEdit &&
                      formatMessage({
                        id: 'mobile_phone',
                        defaultMessage: 'Mobile phone',
                      })}
                  </label>
                  <div className="mt-1 flex text-sm text-slate-900 dark:text-slate-200 sm:mt-0">
                    {isEdit ? (
                      <TextField
                        className="mt-0 w-full"
                        name="phoneMobile"
                        label={formatMessage({
                          id: 'mobile_phone',
                          defaultMessage: 'Mobile phone',
                        })}
                      />
                    ) : (
                      <span className="grow">
                        {profile?.phoneMobile || 'n/a'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="-mx-6 bg-slate-50 dark:bg-slate-800 flex shrink-0 items-center justify-end space-x-4 pr-5">
                {isEdit ? (
                  <SaveAndCancelButtons onCancel={() => setIsEdit(!isEdit)} />
                ) : null}
              </div>
            </div>
          </div>

          <div className="my-7 dark:border-t-slate-800 pt-6 lg:grid lg:grid-cols-3">
            <div className="col-span-1 space-y-1 py-3 lg:py-0">
              <div className="space-y-2">
                <h3 className="text-lg text-slate-900 dark:text-slate-200">
                  {formatMessage({
                    id: 'address',
                    defaultMessage: 'Address',
                  })}
                </h3>
                <p className="mt-3 divide-y divide-slate-200 text-slate-600 dark:divide-slate-700 dark:text-slate-400 mr-4">
                  {formatMessage({
                    id: 'address_notice',
                    defaultMessage:
                      'This information will be displayed publicly so be careful what you share.',
                  })}
                </p>
              </div>

              {(hasRole(IRoleAction.UpdateUser) ||
                currentUser?._id === _id) && (
                <SaveAndCancelButtons
                  showSubmit={isEdit}
                  onCancel={() => setIsEdit(!isEdit)}
                  showCancel
                  cancelText={
                    isEdit
                      ? formatMessage({
                          id: 'cancel',
                          defaultMessage: 'Cancel',
                        })
                      : formatMessage({
                          id: 'update_profile',
                          defaultMessage: 'Update profile / address',
                        })
                  }
                />
              )}
            </div>

            <div className="col-span-2 w-full border-slate-300 dark:border-slate-800 px-6 py-6 rounded-md shadow-sm dark:shadow-none lg:ml-auto lg:w-full bg-white dark:bg-slate-800 ">
              <AddressFields
                isEdit={isEdit}
                address={address}
                setIsEdit={setIsEdit}
              />
            </div>
          </div>
        </div>
      </Form>
    </FormWrapper>
  );
};

export default ProfileView;
