import { useCallback, useRef, useState } from 'react';
import useScanTicket from './useScanTicket.ts';
import useTicketLookup from './useTicketLookup.ts';
import useGateFeedback from './useGateFeedback.ts';
import {
  checkTicket,
  checkTicketCode,
  describeScanError,
  getScanTone,
  redeemGateTicket,
  type GateOutcome,
  type GateTicket,
} from '../utils/scan.ts';

/**
 * State of one gate: checks scanned and typed codes against the gate's events (none: any event),
 * redeems through scanTicket and signals the result. Codes arriving while a check runs are not
 * dropped: the latest one is checked next, so a queue can be scanned without waiting for each
 * result.
 */
const useGateCheck = ({
  eventIds,
  autoRedeem = false,
  feedback = true,
  onRedeemed,
}: {
  eventIds: string[];
  autoRedeem?: boolean;
  feedback?: boolean;
  onRedeemed?: () => void;
}) => {
  const { scanTicket } = useScanTicket();
  const { lookupTickets } = useTicketLookup();
  const { unlock, signal } = useGateFeedback(feedback);
  const [outcome, setOutcome] = useState<GateOutcome | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const pendingRef = useRef<{ code: string; fromCamera: boolean } | null>(null);

  const api = {
    lookupTickets: (input: { code: string; productId?: string | null }) =>
      lookupTickets(input) as Promise<GateTicket[]>,
    redeemTicket: (input: { tokenId: string; productId?: string | null; accessKey?: string | null }) =>
      scanTicket(input) as Promise<GateTicket>,
  };

  const show = (next: GateOutcome | null) => {
    setOutcome(next);
    if (next?.check) signal(getScanTone(next.check));
    if (next?.check?.verdict === 'ADMITTED') onRedeemed?.();
  };

  const run = async (task: () => Promise<GateOutcome | null>) => {
    busyRef.current = true;
    setBusy(true);
    try {
      show(await task());
    } catch (error) {
      // The checks explain refusals themselves; this only catches the unexpected.
      setOutcome({ code: '', check: describeScanError(error) });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const checkCode = async (code: string, { fromCamera = false } = {}) => {
    if (busyRef.current) {
      pendingRef.current = { code, fromCamera };
      return;
    }
    await run(() => checkTicketCode({ code, eventIds, fromCamera, autoRedeem }, api));
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) await checkCode(pending.code, { fromCamera: pending.fromCamera });
  };

  // A ticket shown after a QR scan is redeemed with the code's access key, so the server refuses
  // outdated and forged codes; tickets found by search are redeemed on the staff member's word.
  const redeem = async (ticket: GateTicket) => {
    if (busyRef.current) return;
    const accessKey = outcome?.ticket?._id === ticket._id ? outcome?.accessKey : undefined;
    await run(() => redeemGateTicket(ticket, { eventIds }, api, { accessKey }));
  };

  /** Shows a ticket picked from several matches, judged like a single match found by search. */
  const choose = (ticket: GateTicket) =>
    show({
      code: outcome?.code ?? ticket._id,
      ticket,
      check: checkTicket(ticket, { eventIds }),
      matchedBy: 'SEARCH',
    });

  const clear = useCallback(() => setOutcome(null), []);

  return { outcome, busy, checkCode, redeem, choose, clear, unlockFeedback: unlock };
};

export default useGateCheck;
