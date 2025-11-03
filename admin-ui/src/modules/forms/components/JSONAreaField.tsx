import classnames from 'classnames';

import { useIntl } from 'react-intl';
import JSONView from '../../common/components/JSONView';
import useField, { FieldHookProps } from '../hooks/useField';
import FieldWrapper from './FieldWrapper';

interface JSONAreaProps extends FieldHookProps {
  rows?: number;
}

const JSONAreaField = ({
  validators = [],
  rows = 10,
  ...props
}: JSONAreaProps) => {
  const field = useField({
    ...props,
    validators: [
      ...validators,
      {
        isValid: (v) => {
          try {
            JSON?.parse(v);
            return true;
          } catch (err) {
            return false;
          }
        },
        intlMessageDescriptor: {
          id: 'invalid_json_input',
          defaultMessage: 'Invalid JSON input',
        },
      },
    ],
  });

  const handleOnChange = (e) => {
    try {
      JSON.parse(e.target.value || '{}');
      field.setError('');
    } catch (err: any) {
      field.setError(err.message?.replace('JSON.parse', ''));
    } finally {
      field.setValue(e.target.value, true);
      field.setTouched(true);
    }
  };

  const handleOnBlur = (e) => {
    try {
      field.setValue(
        JSON.stringify(JSON.parse(e.target.value), undefined, 2),
        true,
      );
      field.setError('');
    } catch (err: any) {
      field.setError(err.message);
    }
  };

  return (
    <FieldWrapper {...field}>
      <JSONView
        className={classnames(
          'mt-1 block w-full max-w-full rounded-md border-1 border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 shadow-xs dark:shadow-none focus:ring-slate-800 sm:text-sm',
          {
            'border-rose-300 text-rose-600 focus:border-rose-600 focus:ring-rose-600':
              !!field.error,
          },
          props.className,
        )}
        disabled={field.disabled}
        id={field.name}
        name={field.name}
        onChange={handleOnChange}
        onBlur={handleOnBlur}
        placeholder={field.placeholder}
        autoComplete={field.autoComplete}
        value={field.value}
      />
    </FieldWrapper>
  );
};

export default JSONAreaField;
