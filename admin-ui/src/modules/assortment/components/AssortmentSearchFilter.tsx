import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import TagInput from '../../common/components/TagInput';
import { isTruthy } from '../../common/utils/normalizeFilterKeys';
import { normalizeQuery } from '../../common/utils/utils';

const AssortmentSearchFilter = () => {
  const router = useRouter();
  const { formatMessage } = useIntl();

  const handleOnChange = (value) => {
    if (isTruthy(value)) {
      router.push({
        query: normalizeQuery(router.query, value.join(','), 'tags'),
      });
    } else {
      delete router.query?.tags;
      const { tags, ...rest } = router.query;
      const normalized = normalizeQuery(rest);
      if (normalized)
        router.push({
          query: rest,
        });
    }
  };

  return (
    <div className="mt-5 grid grid-cols-6 gap-6">
      <div className="col-span-6 sm:col-span-3 lg:col-span-2">
        <TagInput
          tagList={router.query?.tags}
          onChange={handleOnChange}
          buttonText={formatMessage({
            id: 'apply',
            defaultMessage: 'Apply',
          })}
        />
      </div>
    </div>
  );
};

export default AssortmentSearchFilter;
