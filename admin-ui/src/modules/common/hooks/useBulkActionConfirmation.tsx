import { useCallback, useRef, useState, type ReactNode } from 'react';
import DangerMessage from '../../modal/components/DangerMessage';
import useModal from '../../modal/hooks/useModal';
import type { BulkActionResult } from './useBulkResultHandler';

interface BulkActionConfirmationOptions {
  message: ReactNode;
  okText: string;
  onConfirm: () => Promise<BulkActionResult | null>;
}

interface BulkActionConfirmationProps extends BulkActionConfirmationOptions {
  onClose: (result: BulkActionResult | null) => void;
}

export const BulkActionConfirmation = ({
  message,
  okText,
  onConfirm,
  onClose,
}: BulkActionConfirmationProps) => {
  const [loading, setLoading] = useState(false);
  const confirmationInFlight = useRef(false);

  const confirm = async () => {
    if (confirmationInFlight.current) return;
    confirmationInFlight.current = true;
    setLoading(true);
    try {
      onClose(await onConfirm());
    } catch {
      onClose(null);
    }
  };

  return (
    <DangerMessage
      loading={loading}
      onCancelClick={() => {
        if (!confirmationInFlight.current) onClose(null);
      }}
      message={message}
      onOkClick={confirm}
      okText={okText}
    />
  );
};

const useBulkActionConfirmation = () => {
  const { setModal } = useModal();

  return useCallback(
    (options: BulkActionConfirmationOptions) =>
      new Promise<BulkActionResult | null>((resolve) => {
        let settled = false;
        const close = (result: BulkActionResult | null) => {
          if (settled) return;
          settled = true;
          setModal('');
          resolve(result);
        };
        setModal(<BulkActionConfirmation {...options} onClose={close} />);
      }),
    [setModal],
  );
};

export default useBulkActionConfirmation;
