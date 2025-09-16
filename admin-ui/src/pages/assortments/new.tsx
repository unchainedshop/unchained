import { useRouter } from 'next/router';

import { useIntl } from 'react-intl';
import AssortmentForm from '../../modules/assortment/components/AssortmentForm';
import useCreateAssortment from '../../modules/assortment/hooks/useCreateAssortment';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import FormWrapper from '../../modules/common/components/FormWrapper';
import PageHeader from '../../modules/common/components/PageHeader';
import generateUniqueId from '../../modules/common/utils/getUniqueId';
import LocaleWrapper from '../../modules/common/components/LocaleWrapper';

const AddAssortments = () => {
  const { formatMessage } = useIntl();
  const router = useRouter();
  const { createAssortment } = useCreateAssortment();

  const onSubmitSuccess = (success, data) => {
    router.replace(`/assortments?assortmentSlug=${generateUniqueId(data)}`);
  };

  const onSubmit = async ({ title, subtitle, isRoot, tags, locale }) => {
    const { data, error } = await createAssortment({
      isRoot,
      texts: [{ title, subtitle, locale }],
      tags,
    });
    if (error) return false;
    return { success: true, data: data?.createAssortment };
  };

  return (
    <>
      <BreadCrumbs />
      <div className="mx-auto sm:max-w-2xl">
        <PageHeader
          headerText={formatMessage({
            id: 'new_assortment_header',
            defaultMessage: 'New Assortment',
          })}
        />
        <div className="mt-6 sm:max-w-2xl">
          <FormWrapper>
            <LocaleWrapper>
              <AssortmentForm
                onSubmitSuccess={onSubmitSuccess}
                onSubmit={onSubmit}
              />
            </LocaleWrapper>
          </FormWrapper>
        </div>
      </div>
    </>
  );
};

export default AddAssortments;
