import { useState } from 'react';
import { useIntl } from 'react-intl';

import Form from '../../forms/components/Form';
import SubmitButton from '../../forms/components/SubmitButton';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import useAddAssortmentLink from '../hooks/useAddAssortmentLink';
import FilterableDropdown from '../../common/components/FilterableDropdown';
import TagInputField from '../../forms/components/TagInputField';
import useAuth from '../../Auth/useAuth';
import FormWrapper from '../../common/components/FormWrapper';
import FormErrors from '../../forms/components/FormErrors';
import useAssortments from '../hooks/useAssortments';
import useAssortmentPaths from '../hooks/useAssortmentPaths';
import { ISortDirection } from '../../../gql/types';

const normalizeAssortments = (productsList = []) => {
  return productsList?.map(({ _id, status, texts, media }) => ({
    id: _id,
    tag: status,
    ...texts,
    image: media?.length ? media[0]?.file?.url : null,
  }));
};

const AssortmentLinkForm = ({ assortmentId }) => {
  const { formatMessage } = useIntl();
  const { addAssortmentLink } = useAddAssortmentLink();
  const { assortmentsPaths } = useAssortmentPaths({ assortmentId });

  const parentAssortmentIds = assortmentsPaths?.map(
    ({ assortmentId: parentId }) => parentId,
  );
  const { hasRole } = useAuth();
  const [queryString, setQueryString] = useState('');

  const { assortments, loading } = useAssortments({
    queryString,
    includeInactive: true,
    includeLeaves: true,
    limit: 50,
    sort: [{ key: 'created', value: ISortDirection.Desc }],
  });

  const onSubmit: OnSubmitType = async ({ childAssortmentId, tags }) => {
    await addAssortmentLink({
      childAssortmentId,
      parentAssortmentId: assortmentId,
      tags,
    });
    return { success: true };
  };

  const successMessage = formatMessage({
    id: 'saved',
    defaultMessage: 'Saved',
  });

  const form = useForm({
    submit: onSubmit,
    successMessage,
    initialValues: {
      childAssortmentId: '',
      tags: '',
    },
  });

  return (
    <FormWrapper>
      <Form form={form} id="assortment_link_form">
        <div className="sm:rounded-md">
          <div className="grid gap-6 px-4 py-5 sm:p-6">
            <div className="col-span-12">
              <TagInputField
                name="tags"
                id="tags"
                label={formatMessage({ id: 'tags', defaultMessage: 'Tags' })}
                className="mt-1 w-full text-sm"
              />
              <FilterableDropdown
                name="childAssortmentId"
                label={formatMessage({
                  id: 'child_assortment',
                  defaultMessage: 'Sub-Assortment',
                })}
                required
                isLoading={loading}
                onFilter={setQueryString}
                queryString={queryString}
                data={normalizeAssortments(
                  (assortments || []).filter(
                    ({ _id }) =>
                      _id !== assortmentId &&
                      !parentAssortmentIds.includes(_id),
                  ),
                )}
                className="mt-1 w-full py-2 text-sm text-slate-500"
              />
            </div>
          </div>
          <FormErrors />
          {hasRole('manageAssortments') && (
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

export default AssortmentLinkForm;
