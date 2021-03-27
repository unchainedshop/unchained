import gql from 'graphql-tag';
import React, { useEffect, useState } from 'react';
import { Checkbox, Table } from 'semantic-ui-react';
import { compose, defaultProps } from 'recompose';
import DatePicker from 'react-datepicker';

import InfiniteDataTable, { withDataTableLoader } from '../InfiniteDataTable';
import WorkTypeSelector from './WorkTypeSelector';
import WorkRow from './WorkRow';

const WorkList = ({
  onFilterChange,
  onDateRangeChange,
  statusTypes,
  selectTypes,
  loading,
  updateHasMore,
  startDate,
  endDate,
  queryOptions,
  ...rest
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState([]);
  const [activeStatus, setActiveStatus] = useState(statusTypes);
  const [relativeDate, setDate] = useState(new Date());
  useEffect(() => {
    const refreshDates = setInterval(() => {
      setDate(new Date());
    }, 2000);

    return () => {
      clearInterval(refreshDates);
    };
  }, [activeStatus, selectedTypeFilter]);

  if (!activeStatus.length) {
    setActiveStatus(statusTypes);
  }
  const onWorkStatusChange = (e, { label, checked }) => {
    const currentStatus = [...activeStatus];
    if (checked) {
      currentStatus.push(label);
    } else {
      currentStatus.splice(currentStatus.indexOf(label), 1);
    }
    setActiveStatus(currentStatus);

    onFilterChange({ filterType: 'status', value: currentStatus });
  };

  return (
    <>
      <InfiniteDataTable
        {...rest}
        cols={6}
        createPath={null}
        rowRenderer={(work) => (
          <WorkRow key={work._id} work={work} relativeDate={relativeDate} />
        )}
      >
        <Table.Row>
          <Table.HeaderCell>
            <span>From</span> <br />
            <DatePicker
              name="startDate"
              onChange={(e) => onDateRangeChange('start', e)}
              placeholderText="Start date"
              dateFormat="dd.MM.yyyy"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              selected={startDate}
              showTimeInput
            />
          </Table.HeaderCell>
          <Table.HeaderCell>
            <span>To</span>
            <br />
            <DatePicker
              name="endDate"
              onChange={(e) => onDateRangeChange('end', e)}
              placeholderText="End Date"
              value={new Date()}
              dateFormat="dd.MM.yyyy"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              selected={endDate}
              showTimeInput
            />
          </Table.HeaderCell>
        </Table.Row>
        <Table.Row>
          <Table.HeaderCell colSpan="2">
            <WorkTypeSelector
              onChange={(e, { value }) => {
                setSelectedTypeFilter(value);
                onFilterChange({ filterType: 'workType', value });
              }}
            />
          </Table.HeaderCell>
          {statusTypes.map((status) => (
            <Table.HeaderCell key={status}>
              <Checkbox
                label={status}
                checked={activeStatus.indexOf(status) !== -1}
                onChange={onWorkStatusChange}
              />
            </Table.HeaderCell>
          ))}
        </Table.Row>

        <Table.Row>
          <Table.HeaderCell>Work #</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
          <Table.HeaderCell>Created</Table.HeaderCell>
          <Table.HeaderCell>Scheduled</Table.HeaderCell>
          <Table.HeaderCell>Started</Table.HeaderCell>
          <Table.HeaderCell>Finished</Table.HeaderCell>
        </Table.Row>
      </InfiniteDataTable>
    </>
  );
};

export default compose(
  defaultProps({ limit: 20, offset: 0 }),
  withDataTableLoader({
    queryName: 'workQueue',
    query: gql`
      query workQueue(
        $offset: Int
        $limit: Int
        $status: [WorkStatus!]!
        $selectTypes: [WorkType!] = []
        $startDate: Date
        $endDate: Date
      ) {
        workQueue(
          offset: $offset
          limit: $limit
          status: $status
          selectTypes: $selectTypes
          startDate: $startDate
          endDate: $endDate
        ) {
          _id
          type
          scheduled
          status
          started
          finished
          created
        }
      }
    `,
  })
)(WorkList);
