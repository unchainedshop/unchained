import classnames from 'classnames';

import { useIntl } from 'react-intl';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { validateMaxLength } from '../lib/validators';
import useField, { FieldHookProps } from '../hooks/useField';
import FieldWrapper from './FieldWrapper';
import Tab from '../../common/components/Tab';

const GetCurrentTab = ({ selectedView = 'edit', ...field }) => {
  if (selectedView === 'preview') {
    return (
      <div className="prose dark:prose-invert">
        <ReactMarkdown
          rehypePlugins={[rehypeRaw, remarkGfm, rehypeSanitize] as any}
        >
          {field.value}
        </ReactMarkdown>
      </div>
    );
  }
  return (
    <textarea
      className={classnames(
        'relative mt-1 block w-full dark:focus:autofill dark:hover:autofill dark:autofill dark:placeholder:text-slate-400 dark:bg-slate-900 dark:text-slate-200 appearance-none rounded-md border-1 border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-xs placeholder:text-slate-400  focus:outline-hidden focus:ring-2 focus:ring-slate-800',
        field.className,
        {
          'border-rose-700 placeholder:text-rose-300 placeholder-rose-300':
            !!field.error,
        },
      )}
      disabled={field.disabled}
      id={field.name}
      name={field.name}
      rows={field.rows || 10}
      onChange={field.onChange}
      onBlur={field.onBlur}
      placeholder={field.placeholder}
      autoComplete={field.autoComplete || 'off'}
      value={field.value}
    />
  );
};
interface TextAreaFieldProps extends FieldHookProps {
  autoComplete?: 'on' | 'off';
  rows?: number;
}

const MarkdownTextAreaField = ({
  maxLength,
  validators = [],

  ...props
}: TextAreaFieldProps) => {
  const { formatMessage } = useIntl();
  const field = useField({
    validators: [...validators, maxLength && validateMaxLength(maxLength)],
    ...props,
  });

  const TextAreaStates = [
    {
      id: 'editor',
      title: formatMessage({
        id: 'editor',
        defaultMessage: 'Editor',
      }),
      Icon: <PencilIcon className="h-4 w-5" />,
    },

    {
      id: 'preview',
      title: formatMessage({
        id: 'preview',
        defaultMessage: 'preview',
      }),
      Icon: <EyeIcon className="h-4 w-5" />,
    },
  ];

  return (
    <FieldWrapper {...field}>
      <div className="-mt-8">
        <Tab tabItems={TextAreaStates} defaultTab="editor">
          <GetCurrentTab {...field} />
        </Tab>
      </div>
    </FieldWrapper>
  );
};

export default MarkdownTextAreaField;
