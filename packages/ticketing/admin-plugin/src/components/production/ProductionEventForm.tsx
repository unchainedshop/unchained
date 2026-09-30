import { useIntl } from 'react-intl';
import { useAuth } from '@unchainedshop/admin-ui/hooks';
import { FormWrapper } from '@unchainedshop/admin-ui/ui';
import { Form, SubmitButton, TextField } from '@unchainedshop/admin-ui/form';
import { useForm } from '@unchainedshop/admin-ui/hooks';
import useTicketProductionMutations from '../../hooks/useTicketProductionMutations.ts';
import {
  productionEventFormValues,
  toUpdateTicketProductionInput,
} from '../../utils/production-form.ts';
import { FormFooter, SaleRulesFields, errorMessage } from './fields.tsx';

/**
 * Location, duration and door opening of all dates (unless a date sets its own) and the sale rules
 * that apply to every date without rules of its own.
 */
const ProductionEventForm = ({ production }: { production: any }) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { updateTicketProduction } = useTicketProductionMutations();

  const form = useForm({
    submit: async (values) => {
      const result = toUpdateTicketProductionInput(values);
      if ('errors' in result) {
        result.errors.forEach((name) =>
          form.api.setFieldError(
            name,
            formatMessage({ id: 'invalid_value', defaultMessage: 'Enter a valid value' }),
          ),
        );
        return { success: false, error: { message: '' } };
      }
      try {
        await updateTicketProduction(production._id, result.input);
        return { success: true };
      } catch (error) {
        return { success: false, error: { message: errorMessage(error) } };
      }
    },
    getSubmitErrorMessage: (error) => error?.message,
    successMessage: formatMessage({
      id: 'production_event_saved',
      defaultMessage: 'Saved for the production and its dates',
    }),
    initialValues: productionEventFormValues(production),
    enableReinitialize: true,
  });

  return (
    <FormWrapper>
      <Form form={form}>
        <div className="space-y-6 p-5 pb-7">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              name="location"
              label={formatMessage({ id: 'event_form_location', defaultMessage: 'Location' })}
            />
            <TextField
              name="durationMinutes"
              type="number"
              label={formatMessage({ id: 'event_form_duration', defaultMessage: 'Duration (minutes)' })}
            />
            <TextField
              name="doorsOpenMinutesBefore"
              type="number"
              label={formatMessage({
                id: 'event_form_doors_open',
                defaultMessage: 'Doors open (minutes before the start)',
              })}
            />
          </div>
          <div>
            <h3 className="mb-3 text-base font-medium text-text-primary">
              {formatMessage({ id: 'sale_rules', defaultMessage: 'Sale rules' })}
            </h3>
            <SaleRulesFields />
          </div>
        </div>
        {hasRole('manageProducts') && (
          <FormFooter>
            <SubmitButton label={formatMessage({ id: 'save', defaultMessage: 'Save' })} />
          </FormFooter>
        )}
      </Form>
    </FormWrapper>
  );
};

export default ProductionEventForm;
