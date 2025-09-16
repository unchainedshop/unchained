import { useIntl } from 'react-intl';

import { useRouter } from 'next/router';
import useForm from '../../forms/hooks/useForm';
import Form from '../../forms/components/Form';
import TextField from '../../forms/components/TextField';
import SelectField from '../../forms/components/SelectField';
import DatePickerField from '../../forms/components/DatePickerField';
import EmailField from '../../forms/components/EmailField';
import PasswordField from '../../forms/components/PasswordField';
import SaveAndCancelButtons from '../../common/components/SaveAndCancelButtons';
import FormErrors from '../../forms/components/FormErrors';
import { validateBirthdate } from '../../forms/lib/validators';

const CreateUserForm = ({ onSubmit, onSubmitSuccess }) => {
  const { formatMessage } = useIntl();
  const router = useRouter();
  const successMessage = formatMessage({
    id: 'user_profile_created',
    defaultMessage: 'User profile created successfully!',
  });
  const form = useForm({
    submit: onSubmit,
    onSubmitSuccess,
    getSubmitErrorMessage: (error) => {
      if (error?.message?.toLowerCase().includes('email already exists'))
        form.formik.setFieldError(
          'email',
          formatMessage({
            id: 'email_already_exists_error',
            defaultMessage: 'Email already exists',
          }),
        );

      return '';
    },
    successMessage,
    initialValues: {
      displayName: '',
      gender: '',
      birthday: new Date(),
      phoneMobile: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      company: '',
      addressLine: '',
      addressLine2: '',
      postalCode: '',
      regionCode: '',
      countryCode: '',
      city: '',
    },
  });
  const back = () => {
    router.back();
  };

  return (
    <Form form={form} className="max-w-6xl">
      <div className="space-y-4 overflow-hidden rounded-md lg:grid lg:grid-cols-3">
        <div className="flex justify-between pt-5 sm:col-span-1">
          <div className="space-y-1">
            <h3 className="text-lg text-slate-900 dark:text-slate-200">
              {formatMessage({
                id: 'profile',
                defaultMessage: 'Profile',
              })}
            </h3>
            <p className="divide-y divide-slate-200 dark:divide-slate-700 dark:text-slate-400 mr-4">
              {formatMessage({
                id: 'profile_notice',
                defaultMessage:
                  'This information will be displayed publicly so be careful what you share.',
              })}
            </p>
          </div>
          <span className="ml-4 flex shrink-0 items-start space-x-4" />
        </div>

        <div className="mt-1 rounded-md border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-800 pt-5 shadow-sm dark:shadow-none lg:col-span-2">
          <div className="px-6 space-y-4">
            <div>
              <EmailField
                className="mt-0 w-full"
                name="email"
                required
                label={formatMessage({
                  id: 'email',
                  defaultMessage: 'Email',
                })}
              />
            </div>

            <div>
              <PasswordField
                className="mt-0 w-full"
                name="password"
                label={formatMessage({
                  id: 'password',
                  defaultMessage: 'Password',
                })}
              />
            </div>
            <div>
              <TextField
                className="mt-0 w-full"
                name="displayName"
                label={formatMessage({
                  id: 'display_name',
                  defaultMessage: 'Display name',
                })}
              />
            </div>

            <div>
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
            </div>
            <div>
              <DatePickerField
                label={formatMessage({
                  id: 'birthday',
                  defaultMessage: 'Birthday',
                })}
                className="mt-0 w-full"
                name="birthday"
                validators={[validateBirthdate]}
              />
            </div>
            <div>
              <TextField
                className="mt-0 w-full"
                name="phoneMobile"
                label={formatMessage({
                  id: 'mobile_phone',
                  defaultMessage: 'Mobile phone',
                })}
              />
            </div>
          </div>

          <div className="border-t-slate-100 border-t dark:border-t-slate-700 bg-slate-50 dark:bg-slate-800 mt-5 pr-5">
            <FormErrors />
            <SaveAndCancelButtons className="justify-end" onCancel={back} />
          </div>
        </div>

        <div className="mb-6 w-full lg:col-span-3" />

        <div className="flex justify-between pt-6 lg:col-span-1">
          <div className="space-y-1">
            <h3 className="text-lg text-slate-900 dark:text-slate-200">
              {formatMessage({
                id: 'address',
                defaultMessage: 'Address',
              })}
            </h3>
            <p className="divide-y divide-slate-200 dark:divide-slate-700 dark:text-slate-400 mr-4">
              {formatMessage({
                id: 'address_notice',
                defaultMessage:
                  'This information will be displayed publicly so be careful what you share.',
              })}
            </p>
          </div>
        </div>

        <div className="rounded-md bg-white dark:bg-slate-800 pt-5 mb-5 shadow-sm dark:shadow-none lg:col-span-2">
          <div className="px-5 space-y-4">
            <div className="mt-1 flex text-sm sm:mt-0">
              <div className="flex w-full">
                <TextField
                  className="mt-0 w-full"
                  name="firstName"
                  label={formatMessage({
                    id: 'first_name',
                    defaultMessage: 'First name',
                  })}
                />
                <TextField
                  className="ml-2 mt-0 w-full"
                  name="lastName"
                  label={formatMessage({
                    id: 'last_Name',
                    defaultMessage: 'Last name',
                  })}
                />
              </div>
            </div>
            <div>
              <TextField
                className="mt-0 w-full"
                name="company"
                label={formatMessage({
                  id: 'company',
                  defaultMessage: 'Company',
                })}
              />
            </div>
            <div>
              <TextField
                className="mt-0 w-full"
                name="addressLine"
                label={formatMessage({
                  id: 'address_line_1',
                  defaultMessage: 'Address line 1 (Street, House no)',
                })}
              />
            </div>
            <div>
              <TextField
                className="mt-0 w-full"
                name="addressLine2"
                label={formatMessage({
                  id: 'address_line_2',
                  defaultMessage: 'Address line 2',
                })}
              />
            </div>

            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 space-y-4 sm:space-y-0">
              <div>
                <TextField
                  className="mt-0 w-full"
                  name="regionCode"
                  label={formatMessage({
                    id: 'region_Code',
                    defaultMessage: 'Region',
                  })}
                />
              </div>

              <div>
                <TextField
                  className="mt-0 w-full"
                  name="postalCode"
                  label={formatMessage({
                    id: 'postal_code',
                    defaultMessage: 'Postal/ZIP code',
                  })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 space-y-4 sm:space-y-0">
              <div>
                <TextField
                  className="mt-0 w-full"
                  name="city"
                  label={formatMessage({
                    id: 'city',
                    defaultMessage: 'City',
                  })}
                />
              </div>
              <div>
                <TextField
                  className="mt-0 w-full"
                  name="countryCode"
                  label={formatMessage({
                    id: 'country_code',
                    defaultMessage: 'Country code',
                  })}
                />
              </div>
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mt-5 pr-5">
            <SaveAndCancelButtons className="justify-end" onCancel={back} />
          </div>
        </div>
      </div>
    </Form>
  );
};

export default CreateUserForm;
