import classNames from 'classnames';
import { CommonFieldProps } from '../../forms/hooks/useField';

const JSONView = ({
  value,
  className,
  onChange = () => {},
  ...props
}: CommonFieldProps) => {
  return (
    <textarea
      className={classNames(
        'text-black dark:bg-slate-900 dark:text-slate-200 border-transparent border-t border-t-slate-200 dark:border-t-slate-800',
        className,
      )}
      value={value}
      onChange={onChange}
      rows={Math.max(((value || ' ')?.split(' ') || []).length / 2, 7)}
      {...props}
    />
  );
};

export default JSONView;
