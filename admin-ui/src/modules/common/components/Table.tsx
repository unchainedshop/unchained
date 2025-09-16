import React, { useEffect, useState } from 'react';

import classNames from 'classnames';
import { useIntl } from 'react-intl';
import Cell from './TableCell';
import Row from './TableRow';
import NoData from './NoData';

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
      className={classNames(
        'overflow-hidden my-3 flex w-full flex-row flex-nowrap divide-y divide-slate-200 dark:divide-slate-600  shadow-sm sm:rounded-lg sm:bg-white dark:bg-slate-950',
        className,
      )}
      {...props}
    >
      <thead className="hidden sm:table-header-group bg-slate-100 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200">
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
