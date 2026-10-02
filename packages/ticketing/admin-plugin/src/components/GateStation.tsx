import { useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useLocalStorage } from '@unchainedshop/admin-ui/hooks';
import { Button, Table, Toggle } from '@unchainedshop/admin-ui/ui';
import { EmptyNotice } from './Notice.tsx';
import useGateCheck from '../hooks/useGateCheck.ts';
import { buyerLabel } from '../utils/attendees.ts';
import QrCameraScanner from './QrCameraScanner.tsx';
import TicketCheckCard from './TicketCheckCard.tsx';
import TicketStatusBadge from './TicketStatusBadge.tsx';
import GateAttendeeList from './GateAttendeeList.tsx';

/**
 * Admission for the gate's events (one, or all products of one performance): scan QR codes with
 * the camera, type a code (ticket id, #serial, order number or attendee name; USB and Bluetooth
 * barcode scanners type into the same field), see the verdict and redeem. The attendee list
 * below redeems through the same path.
 */
const GateStation = ({ events }: { events: any[] }) => {
  const { formatMessage } = useIntl();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useLocalStorage('unchained-ticketing-gate-feedback', true);
  const [autoRedeem, setAutoRedeem] = useLocalStorage('unchained-ticketing-gate-auto-redeem', false);
  const eventIds = events.map(({ _id }) => _id);
  const gate = useGateCheck({ eventIds, autoRedeem, feedback });
  const guest = formatMessage({ id: 'gate_guest', defaultMessage: 'Guest' });

  const onSubmit = async (e) => {
    e.preventDefault();
    gate.unlockFeedback();
    await gate.checkCode(code);
    // Keep the code for refining a name search; the next scan or keystroke replaces it.
    inputRef.current?.select();
  };

  const onRedeem = (ticket) => {
    gate.unlockFeedback();
    gate.redeem(ticket);
  };

  const { outcome } = gate;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <QrCameraScanner
          onStart={gate.unlockFeedback}
          onCode={(text) => gate.checkCode(text, { fromCamera: true })}
        />
        <form onSubmit={onSubmit} className="flex gap-2">
          <label htmlFor="gate-ticket-code" className="sr-only">
            {formatMessage({ id: 'gate_code_label', defaultMessage: 'Ticket code' })}
          </label>
          <input
            ref={inputRef}
            id="gate-ticket-code"
            type="search"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={formatMessage({
              id: 'gate_code_placeholder',
              defaultMessage: 'Ticket code, #serial, order number or attendee name',
            })}
            className="relative block w-full appearance-none rounded-md border-1 border-slate-300 px-4 py-2.5 text-base text-slate-900 shadow-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-focus-ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
          <Button
            type="submit"
            disabled={!code.trim() || gate.busy}
            text={formatMessage({ id: 'gate_check', defaultMessage: 'Check' })}
          />
        </form>
        <div className="flex flex-col gap-3">
          <Toggle
            active={Boolean(autoRedeem)}
            onToggle={() => setAutoRedeem(!autoRedeem)}
            toggleText={formatMessage({
              id: 'gate_auto_redeem',
              defaultMessage: 'Redeem valid ticket QR codes right after scanning',
            })}
          />
          <Toggle
            active={Boolean(feedback)}
            onToggle={() => setFeedback(!feedback)}
            toggleText={formatMessage({ id: 'gate_feedback', defaultMessage: 'Sound and vibration' })}
          />
        </div>
      </div>

      <div className="space-y-4">
        {gate.busy && !outcome && (
          <p className="text-sm text-text-muted">
            {formatMessage({ id: 'gate_checking', defaultMessage: 'Checking…' })}
          </p>
        )}
        {outcome?.candidates && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">
              {formatMessage(
                {
                  id: 'gate_candidates',
                  defaultMessage: '{count} tickets match "{code}"',
                },
                { count: outcome.candidates.length, code: outcome.code },
              )}
            </p>
            <Table className="min-w-full">
              {outcome.candidates.map((ticket) => (
                <Table.Row key={ticket._id}>
                  <Table.Cell>
                    <span className="flex min-w-0 flex-col">
                      <span className="block font-medium text-text-primary">
                        #{ticket.tokenSerialNumber || ticket._id.slice(-8)}{' '}
                        {ticket.attendeeName || buyerLabel(ticket.user, guest)}
                      </span>
                      {!eventIds.includes(ticket.product?._id) ? (
                        <span className="block truncate text-sm text-rose-600">
                          {[ticket.product?.texts?.title, ticket.product?.event?.categoryTitle]
                            .filter(Boolean)
                            .join(' · ') ||
                            formatMessage({ id: 'gate_other_event', defaultMessage: 'Other event' })}
                        </span>
                      ) : (
                        events.length > 1 &&
                        ticket.product?.event?.categoryTitle && (
                          <span className="block truncate text-sm text-text-muted">
                            {ticket.product.event?.categoryTitle}
                          </span>
                        )
                      )}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <TicketStatusBadge token={ticket} />
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        text={formatMessage({ id: 'gate_choose', defaultMessage: 'Check' })}
                        onClick={() => gate.choose(ticket)}
                      />
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table>
          </div>
        )}
        {outcome?.check && (
          <TicketCheckCard
            outcome={outcome}
            eventIds={eventIds}
            busy={gate.busy}
            onRedeem={onRedeem}
            onDismiss={() => {
              gate.clear();
              inputRef.current?.focus();
            }}
          />
        )}
        {!outcome && !gate.busy && (
          <EmptyNotice>
            {formatMessage({
              id: 'gate_idle',
              defaultMessage: 'Scan a ticket or type its code to check it.',
            })}
          </EmptyNotice>
        )}
      </div>

      <div className="lg:col-span-2">
        <GateAttendeeList events={events} busy={gate.busy} onRedeem={onRedeem} />
      </div>
    </div>
  );
};

export default GateStation;
