import classNames from 'classnames';
import React from 'react';

const TableRow = ({
  className = '',
  children = [],
  header = false,
  enablesort = false,
  ...props
}) => {
  const clone = (cell) =>
    React?.cloneElement(cell || <span />, { header, enablesort });
  const cells = React.Children.map(children, clone);
  return (
    <tr
      className={classNames(
        'grid grid-cols-1 auto-rows-fr border border-slate-100 dark:border-slate-700 sm:border-0 rounded-md sm:mb-0 sm:table-row sm:rounded-none bg-white dark:bg-slate-800 sm:bg-inherit dark:sm:bg-inherit',
        className,
      )}
      {...props}
    >
      {cells}
    </tr>
  );
};

export default TableRow;
