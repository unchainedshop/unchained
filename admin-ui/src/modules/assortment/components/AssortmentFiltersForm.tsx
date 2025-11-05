import React, { useState } from 'react';
import { IRoleAction } from '../../../gql/types';

import { useIntl } from 'react-intl';

import Form from '../../forms/components/Form';
import SubmitButton from '../../forms/components/SubmitButton';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';

import useAddAssortmentFilter from '../hooks/useAddAssortmentFilter';

import FilterableDropdown from '../../common/components/FilterableDropdown';

import TagInputField from '../../forms/components/TagInputField';

import useAuth from '../../Auth/useAuth';
import FormWrapper from '../../common/components/FormWrapper';
import FormErrors from '../../forms/components/FormErrors';
import useFilters from '../../filter/hooks/useFilters';
import { ISortDirection } from '../../../gql/types';

const normalizeFilters = (filterList) => {
  return filterList?.map(({ _id, texts, key }) => ({
    id: _id,
    title: ` (${key})-${texts?.title}`,
  }));
};

const AssortmentFiltersForm = ({ assortmentId }) => {
  const { formatMessage } = useIntl();
  const { addAssortmentFilter } = useAddAssortmentFilter();
  const { hasRole } = useAuth();

  const [queryString, setQueryString] = useState('');
  const { filters } = useFilters({
    queryString,
    limit: 50,
    includeInactive: true,
    sort: [{ key: 'created', value: ISortDirection.Desc }],
  });

  const successMessage = formatMessage({
    id: 'saved',
    defaultMessage: 'Saved',
  });

  const onSubmit: OnSubmitType = async ({ filterId, tags }) => {
    await addAssortmentFilter({ filterId, assortmentId, tags });

    return { success: true };
  };

  const form = useForm({
    submit: onSubmit,
    successMessage,
    initialValues: {
      filterId: '',
      tags: '',
    },
  });

  return (
    <FormWrapper>
      <Form form={form} id="assortment_filter_form">
        <div className="shadow dark:shadow-none sm:rounded-md">
          <div className="grid gap-6 px-4 py-5 sm:p-6">
            <div className="col-span-12">
              <TagInputField
                name="tags"
                id="tags"
                label={formatMessage({ id: 'tags', defaultMessage: 'Tags' })}
                className="mt-1 w-full text-sm font-medium text-slate-500"
              />
              <FilterableDropdown
                name="filterId"
                required
                label={formatMessage({
                  id: 'filter',
                  defaultMessage: 'Filter',
                })}
                data={normalizeFilters(filters)}
                queryString={queryString}
                onFilter={setQueryString}
                className="mt-1 w-full py-2 text-sm font-medium text-slate-500"
              />
            </div>
          </div>
          <FormErrors />
          {hasRole(IRoleAction.ManageAssortments) && (
            <div className="border-t-slate-100 border-t dark:border-t-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-5 text-right sm:px-6">
              <SubmitButton
                label={formatMessage({
                  id: 'save',
                  defaultMessage: 'Save',
                })}
              />
            </div>
          )}
        </div>
      </Form>
    </FormWrapper>
  );
};

export default AssortmentFiltersForm;
