import classNames from 'classnames';
import { CommonFieldProps } from '../../forms/hooks/useField';

const JSONView = ({
  value,
  className,
  onChange = () => {},
  rows: defaultRows = 7,
  ...props
}: CommonFieldProps & { rows?: number }) => {
  const lineCount = value ? value.split('\n').length : 1;
  const rows = Math.max(lineCount, defaultRows);

  return (
    <textarea
      className={classNames(
        'text-black dark:bg-slate-900 dark:text-slate-200 border-transparent border-t border-t-slate-200 dark:border-t-slate-800 resize-y',
        className,
      )}
      value={value}
      onChange={onChange}
      rows={rows}
      {...props}
    />
  );
};

export default JSONView;
