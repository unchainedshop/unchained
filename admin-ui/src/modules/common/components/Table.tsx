import React, { useEffect, useState } from 'react';

import clsx from 'clsx';
import { useIntl } from 'react-intl';
import Cell from './TableCell';
import Row from './TableRow';
import NoData from '@/components/ui/NoData';

const buildRows = (props) => {
  const header = [];
  const body = [];
  const footer = [];

  React.Children.forEach(props.children, (row) => {
    if (row?.props?.header) {
      header.push(row);
    } else if (row?.props?.footer) {
      footer.push(row);
    } else {
      body.push(row);
    }
  });

  return { header, footer, body };
};

const Table = ({ className = '', ...props }) => {
  const [rows, setRows] = useState(buildRows(props));
  const { formatMessage } = useIntl();

  const rowsWithSort = {
    ...rows,
    header: React.Children.map(rows.header, (c) => React.cloneElement(c)),
  };

  useEffect(() => {
    setRows(buildRows(props));
  }, [props.children]);

  return rowsWithSort.header.length || rowsWithSort.body.length ? (
    <table
      className={clsx(
        'overflow-hidden my-3 flex w-full flex-row flex-nowrap divide-y divide-slate-200 dark:divide-slate-600  shadow-sm sm:rounded-lg sm:bg-white dark:bg-slate-950',
        className,
      )}
      {...props}
    >
      <thead className="hidden sm:table-header-group bg-surface-raised text-sm text-text-secondary">
        {rowsWithSort.header}
      </thead>

      {rowsWithSort.body.length ? (
        <tbody className="space-y-4 sm:space-y-0 flex-1 sm:divide-y divide-slate-200 dark:divide-slate-700 sm:bg-white dark:sm:bg-slate-800 sm:flex-none">
          {rowsWithSort.body}
        </tbody>
      ) : null}
      {rowsWithSort.footer.length ? <tfoot>{rowsWithSort.footer}</tfoot> : null}
    </table>
  ) : (
    <NoData
      message={formatMessage({
        id: 'data',
        defaultMessage: 'Data',
      })}
    />
  );
};

Table.Row = Row;
Table.Cell = Cell;

export default Table;
