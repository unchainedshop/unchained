import React from 'react';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

import TagInput from '../../common/components/TagInput';
import { isTruthy } from '../../common/utils/normalizeFilterKeys';
import { normalizeQuery } from '../../common/utils/utils';

const ProductFilter = () => {
  const router = useRouter();
  const { formatMessage } = useIntl();

  const handleOnChange = (value) => {
    if (isTruthy(value)) {
      router.push({
        query: normalizeQuery(router.query, value?.join(','), 'tags'),
      });
    } else {
      const { tags, ...rest } = router.query;

      router.push({
        query: normalizeQuery(rest),
      });
    }
  };

  return (
    <div className="mt-5 grid grid-cols-6 gap-6">
      <div className="col-span-6 sm:col-span-4 lg:col-span-3 xl:col-span-2">
        <TagInput
          buttonText={formatMessage({
            id: 'apply',
            defaultMessage: 'Apply',
          })}
          tagList={(router?.query?.tags as string)?.split(',')}
          onChange={handleOnChange}
        />
      </div>
    </div>
  );
};

export default ProductFilter;
