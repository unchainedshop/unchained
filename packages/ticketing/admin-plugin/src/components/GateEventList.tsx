import { Fragment } from 'react';
import { useIntl } from 'react-intl';
import { Badge, Button, Table } from '@unchainedshop/admin-ui/ui';
import { findSamePerformance } from '../utils/gate-events.ts';
import { useFormatDateTime } from '../utils/misc.ts';

/**
 * The events a gate can pick, soonest first; ticket details load once the gate opens. Open admits
 * one event. A performance sold as several products (one per ticket category or seating area) gets
 * a shortcut that opens one gate for all of them, and any events can be ticked to open one gate
 * for them together.
 */
const GateEventList = ({
  events,
  selectedIds,
  onSelectionChange,
  onOpen,
}: {
  events: any[];
  selectedIds: string[];
  onSelectionChange: (eventIds: string[]) => void;
  onOpen: (eventIds: string[]) => void;
}) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  const toggle = (eventId: string) =>
    onSelectionChange(
      selectedIds.includes(eventId)
        ? selectedIds.filter((id) => id !== eventId)
        : [...selectedIds, eventId],
    );

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface p-4 shadow-sm">
          <span className="text-sm font-medium text-text-primary">
            {formatMessage(
              {
                id: 'gate_events_selected',
                defaultMessage: '{count, plural, one {# event} other {# events}} selected',
              },
              { count: selectedIds.length },
            )}
          </span>
          <div className="flex flex-wrap gap-2">
            {selectedIds.length < events.length && (
              <Button
                variant="secondary"
                size="sm"
                text={formatMessage({ id: 'gate_select_all', defaultMessage: 'Select all' })}
                onClick={() => onSelectionChange(events.map(({ _id }) => _id))}
              />
            )}
            <Button
              variant="secondary"
              size="sm"
              text={formatMessage({ id: 'gate_clear_selection', defaultMessage: 'Clear' })}
              onClick={() => onSelectionChange([])}
            />
            <Button
              size="sm"
              text={formatMessage({
                id: 'gate_open_selected',
                defaultMessage: 'Admit them at one gate',
              })}
              onClick={() => onOpen(selectedIds)}
            />
          </div>
        </div>
      )}
      <Table className="min-w-full">
        <Table.Row header>
          <Table.Cell> </Table.Cell>
          <Table.Cell>{formatMessage({ id: 'title', defaultMessage: 'Title' })}</Table.Cell>
          <Table.Cell>{formatMessage({ id: 'event_date', defaultMessage: 'Event Date' })}</Table.Cell>
          <Table.Cell>
            {formatMessage({ id: 'gate_tickets_header', defaultMessage: 'Tickets' })}
          </Table.Cell>
          <Table.Cell> </Table.Cell>
        </Table.Row>
        {events.map((event: any) => {
          const performance = findSamePerformance(events, event);
          const opensPerformance = performance.length > 1 && performance[0]._id === event._id;
          return (
            <Fragment key={event._id}>
              {opensPerformance && (
                <Table.Row>
                  <Table.Cell> </Table.Cell>
                  <Table.Cell colSpan={4}>
                    <Button
                      variant="tertiary"
                      size="sm"
                      text={formatMessage(
                        {
                          id: 'gate_open_performance',
                          defaultMessage: 'Admit all {count} categories of {title} at one gate',
                        },
                        { count: performance.length, title: event?.texts?.title || '' },
                      )}
                      onClick={() => onOpen(performance.map(({ _id }) => _id))}
                    />
                  </Table.Cell>
                </Table.Row>
              )}
              <Table.Row>
                <Table.Cell>
                  <input
                    type="checkbox"
                    className="rounded border-border-default"
                    checked={selectedIds.includes(event._id)}
                    onChange={() => toggle(event._id)}
                    aria-label={formatMessage(
                      {
                        id: 'gate_select_event',
                        defaultMessage: 'Admit {title} together with other events',
                      },
                      { title: event?.texts?.title || event._id },
                    )}
                  />
                </Table.Cell>
                <Table.Cell>
                  <div className="flex flex-col">
                    <span className="font-medium text-text-primary">{event?.texts?.title}</span>
                    {event?.texts?.subtitle && (
                      <span className="text-sm text-text-muted">{event.texts.subtitle}</span>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {event.event?.categoryTitle && (
                        <Badge text={event.event.categoryTitle} color="slate" square />
                      )}
                      {event.event?.isCanceled && (
                        <Badge
                          text={formatMessage({
                            id: 'gate_event_cancelled',
                            defaultMessage: 'Cancelled',
                          })}
                          color="rose"
                          square
                        />
                      )}
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex flex-col text-sm">
                    <span className="text-text-secondary">
                      {event.event?.startsAt
                        ? formatDateTime(event.event.startsAt, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : formatMessage({ id: 'gate_no_start', defaultMessage: 'No start date' })}
                    </span>
                    {event.event?.location && (
                      <span className="text-text-muted">{event.event.location}</span>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-medium text-text-primary">{event.tokensCount ?? 0}</span>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      text={formatMessage({ id: 'gate_open', defaultMessage: 'Open gate' })}
                      onClick={() => onOpen([event._id])}
                    />
                  </div>
                </Table.Cell>
              </Table.Row>
            </Fragment>
          );
        })}
      </Table>
    </div>
  );
};

export default GateEventList;
