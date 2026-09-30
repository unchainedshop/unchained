import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import { BreadCrumbs, FormWrapper, HelpText, PageHeader } from '@unchainedshop/admin-ui/ui';
import { Form, SubmitButton, TagInputField, TextField } from '@unchainedshop/admin-ui/form';
import { useApp, useForm } from '@unchainedshop/admin-ui/hooks';
import useTicketProductionMutations from '../hooks/useTicketProductionMutations.ts';
import { toCreateTicketProductionInput } from '../utils/production-form.ts';
import { generateUniqueId } from '../utils/misc.ts';
import { FormFooter, errorMessage } from '../components/production/fields.tsx';

/**
 * A new ticket production, like a new product: title, subtitle, tags and location. Dates, ticket
 * categories, sale rules, texts and images are set up in the tabs of the production afterwards.
 */
const TicketProductionCreatePage = () => {
  const { formatMessage } = useIntl();
  const { replace } = useRouter();
  const { selectedLocale, shopInfo } = useApp();
  const { createTicketProduction } = useTicketProductionMutations();

  const form = useForm({
    submit: async (values) => {
      const result = toCreateTicketProductionInput(values, { locale: selectedLocale });
      if ('errors' in result) return { success: false, error: { message: 'title' } };
      try {
        return { success: true, data: await createTicketProduction(result.input) };
      } catch (error) {
        return { success: false, error: { message: errorMessage(error) } };
      }
    },
    getSubmitErrorMessage: (error) => error?.message,
    onSubmitSuccess: (_, production) => {
      replace(`/ext/ticketing/${generateUniqueId(production)}?tab=dates`);
      return true;
    },
    successMessage: formatMessage({
      id: 'production_created',
      defaultMessage: 'Production added, add its dates next',
    }),
    initialValues: { title: '', subtitle: '', tags: [], location: '' },
  });

  return (
    <>
      <BreadCrumbs depth={4} />
      <PageHeader
        headerText={formatMessage({ id: 'production_new', defaultMessage: 'New production' })}
      />
      <div className="mt-6 gap-10 lg:grid lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FormWrapper>
            <Form form={form}>
              <div className="flex flex-col gap-3 p-5 pb-7 sm:max-w-full">
                <TextField
                  name="title"
                  label={formatMessage({ id: 'name', defaultMessage: 'Name' })}
                  required
                />
                <TextField
                  name="subtitle"
                  label={formatMessage({ id: 'subtitle', defaultMessage: 'Subtitle' })}
                />
                <TextField
                  name="location"
                  label={formatMessage({ id: 'event_form_location', defaultMessage: 'Location' })}
                />
                <TagInputField
                  name="tags"
                  label={formatMessage({ id: 'tags', defaultMessage: 'Tags' })}
                  placeholder={formatMessage({ id: 'enter_tag', defaultMessage: 'Enter tag...' })}
                  selectOptions={(shopInfo?.adminUiConfig?.productTags || []).map((tag) => ({
                    value: tag,
                    label: tag,
                  }))}
                />
                <HelpText
                  messageKey="production_tags_help"
                  defaultMessage="Tags are taken over by every date, for example the organizer of the production."
                  className="mt-1"
                />
              </div>
              <FormFooter>
                <SubmitButton
                  label={formatMessage({ id: 'production_add', defaultMessage: 'Add production' })}
                />
              </FormFooter>
            </Form>
          </FormWrapper>
        </div>
        <div className="mt-10 space-y-2 lg:col-span-1 lg:mt-0">
          <h3 className="text-lg text-text-primary">
            {formatMessage({ id: 'production', defaultMessage: 'Production' })}
          </h3>
          <div className="text-sm dark:text-slate-400 lg:mr-10">
            <p className="my-2 py-2">
              {formatMessage({
                id: 'production_definition',
                defaultMessage:
                  'A production is a play, concert or course with one or more dates. Every date is sold as its own ticket event, optionally in several ticket categories with their own capacity and price.',
              })}
            </p>
            <p className="my-2 py-2">
              {formatMessage({
                id: 'production_next_steps',
                defaultMessage:
                  'After adding it, set up the dates, the ticket categories, the sale rules, texts and images in its tabs, then publish the production with all its dates.',
              })}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default TicketProductionCreatePage;
