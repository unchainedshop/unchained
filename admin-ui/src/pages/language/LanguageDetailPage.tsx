import { useRouter } from 'next/router';
import { IRoleAction } from '../../gql/types';

import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

import LanguageForm from '../../modules/language/components/LanguageForm';
import useLanguage from '../../modules/language/hooks/useLanguage';
import useRemoveLanguage from '../../modules/language/hooks/useRemoveLanguage';
import useUpdateLanguage from '../../modules/language/hooks/useUpdateLanguage';
import PageHeader from '../../modules/common/components/PageHeader';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import useModal from '../../modules/modal/hooks/useModal';
import HeaderDeleteButton from '../../modules/common/components/HeaderDeleteButton';
import FormWrapper from '../../modules/common/components/FormWrapper';
import Loading from '../../modules/common/components/Loading';
import useAuth from '../../modules/Auth/useAuth';

const LanguageDetailPage = ({ languageId }) => {
  const { updateLanguage } = useUpdateLanguage();
  const { push } = useRouter();

  const { setModal } = useModal();
  const { removeLanguage } = useRemoveLanguage();
  const { language, loading } = useLanguage({
    languageId: languageId as string,
  });
  const { hasRole } = useAuth();

  const { formatMessage, locale } = useIntl();

  const onSubmit = async ({ isoCode, isActive }) => {
    await updateLanguage({
      language: { isoCode, isActive },
      languageId: languageId as string,
    });
    return true;
  };

  const onDelete = async () => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_language_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this language?',
        })}
        onOkClick={async () => {
          setModal('');
          await removeLanguage({ languageId: languageId as string });
          toast.success(
            formatMessage({
              id: 'language_deleted',
              defaultMessage: 'Language deleted successfully',
            }),
          );
          push('/language');
        }}
        okText={formatMessage({
          id: 'delete_language',
          defaultMessage: 'Delete language',
        })}
      />,
    );
  };

  const normalizeLanguageName = (isoCode) => {
    return isoCode
      ? `${new Intl.DisplayNames([locale], { type: 'language' }).of(
          language.isoCode,
        )} (${isoCode})`
      : '';
  };

  return (
    <>
      <BreadCrumbs
        currentPageTitle={normalizeLanguageName(language?.isoCode)}
      />
      <div className="items-center flex min-w-full justify-between gap-3 flex-wrap">
        <PageHeader headerText={normalizeLanguageName(language?.isoCode)} />
        {hasRole(IRoleAction.ManageLanguages) && (
          <HeaderDeleteButton onClick={onDelete} />
        )}
      </div>
      {loading ? (
        <Loading />
      ) : (
        <div className="mx-auto mt-6 sm:max-w-xl">
          <FormWrapper>
            <LanguageForm isEdit defaultValue={language} onSubmit={onSubmit} />
          </FormWrapper>
        </div>
      )}
    </>
  );
};

export default LanguageDetailPage;
