import { useIntl } from 'react-intl';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useAuth, useForm } from '@unchainedshop/admin-ui/hooks';
import { FormWrapper } from '@unchainedshop/admin-ui/ui';
import { CheckboxField, Form, FormErrors, SubmitButton, TextField } from '@unchainedshop/admin-ui/form';

const StorefrontSearchInputQuery = gql`
  query StorefrontSearchInput($filterId: ID) {
    filter(filterId: $filterId) {
      _id
      key
      storefrontSearchInput
    }
  }
`;

const SetFilterStorefrontSearchInputMutation = gql`
  mutation SetFilterStorefrontSearchInput($filterId: ID!, $name: String) {
    setFilterStorefrontSearchInput(filterId: $filterId, name: $name) {
      _id
      storefrontSearchInput
    }
  }
`;

const INPUT_NAME = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;

export const StorefrontMcpFilterTab = ({ entityId }: { entityId: string }) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { data } = useQuery<any>(StorefrontSearchInputQuery, { variables: { filterId: entityId } });
  const [setSearchInput] = useMutation(SetFilterStorefrontSearchInputMutation);
  const filter = data?.filter;

  const form = useForm({
    submit: async ({ exposed, name }) => {
      try {
        await setSearchInput({ variables: { filterId: entityId, name: exposed ? name : null } });
        return { success: true };
      } catch (error) {
        return { success: false, error: { message: error.message } };
      }
    },
    getSubmitErrorMessage: (error) => error?.message,
    successMessage: formatMessage({ id: 'saved', defaultMessage: 'Saved' }),
    initialValues: {
      exposed: Boolean(filter?.storefrontSearchInput),
      name: filter?.storefrontSearchInput || (INPUT_NAME.test(filter?.key || '') ? filter.key : ''),
    },
    enableReinitialize: true,
  });

  if (!filter) return null;

  return (
    <FormWrapper>
      <Form form={form}>
        <div className="space-y-4 p-5">
          <p className="text-sm text-text-muted">
            {formatMessage({
              id: 'storefront_search_input_help',
              defaultMessage:
                'Shopping assistants connected to the storefront MCP can search with this filter under the input name.',
            })}
          </p>
          <CheckboxField
            name="exposed"
            label={formatMessage({
              id: 'storefront_search_input_exposed',
              defaultMessage: 'Expose to shopping assistants',
            })}
          />
          <TextField
            name="name"
            label={formatMessage({ id: 'storefront_search_input_name', defaultMessage: 'Input name' })}
          />
        </div>
        <div className="px-5">
          <FormErrors />
        </div>
        {hasRole('manageFilters') && (
          <div className="flex justify-end border-t border-t-border-subtle bg-surface-subtle p-5">
            <SubmitButton label={formatMessage({ id: 'save', defaultMessage: 'Save' })} />
          </div>
        )}
      </Form>
    </FormWrapper>
  );
};
