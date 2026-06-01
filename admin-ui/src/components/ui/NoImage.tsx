import { PhotoIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const NoImage = ({ className = '', containerClassName = '', Icon = null }) => {
  return (
    <span className={clsx('text-slate-400', containerClassName)}>
      {Icon || <PhotoIcon className={clsx(className)} />}
    </span>
  );
};

export default NoImage;
