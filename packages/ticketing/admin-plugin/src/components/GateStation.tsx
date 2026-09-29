import { useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useLocalStorage } from '@unchainedshop/admin-ui/hooks';
import useGateCheck from '../hooks/useGateCheck.ts';
import { buyerLabel } from '../utils/attendees.ts';
import QrCameraScanner from './QrCameraScanner.tsx';
import TicketCheckCard from './TicketCheckCard.tsx';
import TicketStatusBadge from './TicketStatusBadge.tsx';
import GateAttendeeList from './GateAttendeeList.tsx';

const Setting = ({ checked, onChange, children }) => (
  <label className="flex items-center gap-2 text-sm text-text-secondary">
    <input
      type="checkbox"
      className="rounded border-border-default"
      checked={Boolean(checked)}
      onChange={(e) => onChange(e.target.checked)}
    />
    {children}
  </label>
);

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
            className="block w-full rounded-md border border-border-default bg-surface-input px-4 py-3 text-base text-text-primary shadow-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-focus-ring"
          />
          <button
            type="submit"
            disabled={!code.trim() || gate.busy}
            className="inline-flex items-center rounded-md bg-slate-800 px-5 py-3 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
          >
            {formatMessage({ id: 'gate_check', defaultMessage: 'Check' })}
          </button>
        </form>
        <div className="flex flex-wrap gap-3">
          <Setting checked={autoRedeem} onChange={setAutoRedeem}>
            {formatMessage({
              id: 'gate_auto_redeem',
              defaultMessage: 'Redeem valid ticket QR codes right after scanning',
            })}
          </Setting>
          <Setting checked={feedback} onChange={setFeedback}>
            {formatMessage({ id: 'gate_feedback', defaultMessage: 'Sound and vibration' })}
          </Setting>
        </div>
      </div>

      <div className="space-y-4">
        {gate.busy && !outcome && (
          <p className="text-sm text-text-muted">
            {formatMessage({ id: 'gate_checking', defaultMessage: 'Checking…' })}
          </p>
        )}
        {outcome?.candidates && (
          <div className="rounded-lg border border-border-subtle bg-surface shadow-sm">
            <p className="border-b border-border-subtle px-4 py-3 text-sm font-medium text-text-primary">
              {formatMessage(
                {
                  id: 'gate_candidates',
                  defaultMessage: '{count} tickets match "{code}"',
                },
                { count: outcome.candidates.length, code: outcome.code },
              )}
            </p>
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {outcome.candidates.map((ticket) => (
                <li key={ticket._id}>
                  <button
                    type="button"
                    onClick={() => gate.choose(ticket)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-raised"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium text-text-primary">
                        #{ticket.tokenSerialNumber || ticket._id.slice(-8)}{' '}
                        {ticket.attendeeName || buyerLabel(ticket.user, guest)}
                      </span>
                      {!eventIds.includes(ticket.product?._id) ? (
                        <span className="block truncate text-sm text-rose-600">
                          {[ticket.product?.texts?.title, ticket.product?.eventCategory]
                            .filter(Boolean)
                            .join(' · ') ||
                            formatMessage({ id: 'gate_other_event', defaultMessage: 'Other event' })}
                        </span>
                      ) : (
                        events.length > 1 &&
                        ticket.product?.eventCategory && (
                          <span className="block truncate text-sm text-text-muted">
                            {ticket.product.eventCategory}
                          </span>
                        )
                      )}
                    </span>
                    <TicketStatusBadge token={ticket} />
                  </button>
                </li>
              ))}
            </ul>
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
          <p className="rounded-lg border border-dashed border-border-default p-6 text-center text-sm text-text-muted">
            {formatMessage({
              id: 'gate_idle',
              defaultMessage: 'Scan a ticket or type its code to check it.',
            })}
          </p>
        )}
      </div>

      <div className="lg:col-span-2">
        <GateAttendeeList events={events} busy={gate.busy} onRedeem={onRedeem} />
      </div>
    </div>
  );
};

export default GateStation;
