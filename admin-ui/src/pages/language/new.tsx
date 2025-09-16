import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import FormWrapper from '../../modules/common/components/FormWrapper';
import PageHeader from '../../modules/common/components/PageHeader';
import { OnSubmitSuccessType } from '../../modules/forms/hooks/useForm';

import LanguageForm from '../../modules/language/components/LanguageForm';
import useCreateLanguage from '../../modules/language/hooks/useCreateLanguage';

const AddLanguage = () => {
  const { createLanguage } = useCreateLanguage();
  const { formatMessage } = useIntl();
  const router = useRouter();

  const onSubmitSuccess: OnSubmitSuccessType = (_, { _id }) => {
    router.replace(`/language?languageId=${_id}`);
    return true;
  };

  const onSubmit = async ({ isoCode }) => {
    const { data, error } = await createLanguage({ isoCode });
    if (error) return false;
    return { success: true, data: data?.createLanguage };
  };

  return (
    <>
      <BreadCrumbs />
      <div className="mx-auto sm:max-w-2xl">
        <PageHeader
          headerText={formatMessage({
            id: 'new_language_header',
            defaultMessage: 'New language',
          })}
        />

        <div className="mt-6 sm:max-w-xl">
          <FormWrapper>
            <LanguageForm
              defaultValue={{ isoCode: '', isActive: '' }}
              onSubmit={onSubmit}
              onSubmitSuccess={onSubmitSuccess}
            />
          </FormWrapper>
        </div>
      </div>
    </>
  );
};

export default AddLanguage;
