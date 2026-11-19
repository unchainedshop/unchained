import { ReactNode } from 'react';
import SaveAndCancelButtons from '@/components/ui/SaveAndCancelButtons';
import FormErrors from '@/components/ui/form/FormErrors';
import Form from '../../forms/components/Form';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';

const EnrollmentActionForm = ({
  headerText,
  message,
  submitText,
  initialValues,
  onSubmit,
  onCancel,
  children,
}: {
  headerText: string;
  message?: string;
  submitText: string;
  initialValues: Record<string, any>;
  onSubmit: OnSubmitType;
  onCancel: () => void;
  children: ReactNode;
}) => {
  const form = useForm({
    submit: onSubmit,
    onSubmitSuccess: async () => {
      onCancel();
      return true;
    },
    initialValues,
  });

  return (
    <Form form={form}>
      <h3 className="text-lg text-text-primary">{headerText}</h3>
      {message && <p className="mt-2 text-sm text-text-secondary">{message}</p>}
      <div className="mt-4 space-y-4">{children}</div>
      <FormErrors />
      <div className="border border-t-slate-100 bg-slate-50 mt-6 -mx-5 -mb-6 dark:bg-slate-500 dark:border-0">
        <SaveAndCancelButtons
          onCancel={onCancel}
          submitText={submitText}
          className="justify-end"
        />
      </div>
    </Form>
  );
};

export default EnrollmentActionForm;
