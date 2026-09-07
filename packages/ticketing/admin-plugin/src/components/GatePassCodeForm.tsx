import { useState } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import useIsPassCodeValid from '../hooks/useIsPassCodeValid';

const GatePassCodeForm = ({ onAuthenticated }) => {
  const { formatMessage } = useIntl();
  const { validatePassCode, loading } = useIsPassCodeValid();
  const [passCode, setPassCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passCode.trim()) return;

    const valid = await validatePassCode(passCode.trim());
    if (valid) {
      onAuthenticated();
    } else {
      toast.error(
        formatMessage({
          id: 'gate_invalid_passcode',
          defaultMessage: 'Invalid pass code. Please try again.',
        }),
      );
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="bg-surface rounded-lg shadow-md p-8">
        <p className="text-sm text-text-muted mb-6">
          {formatMessage({
            id: 'gate_enter_passcode',
            defaultMessage: 'Enter the scanner pass code to activate the gate control.',
          })}
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={passCode}
            onChange={(e) => setPassCode(e.target.value)}
            placeholder={formatMessage({
              id: 'gate_passcode_placeholder',
              defaultMessage: 'Pass code',
            })}
            className="mb-4 block w-full rounded-md border border-border-default bg-surface-input px-4 py-2 text-sm text-text-primary placeholder-text-muted focus:border-focus-ring focus:outline-none focus:ring-1 focus:ring-focus-ring"
            required
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !passCode.trim()}
            className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-on-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? formatMessage({
                  id: 'gate_verifying',
                  defaultMessage: 'Verifying...',
                })
              : formatMessage({
                  id: 'gate_activate',
                  defaultMessage: 'Activate Scanner',
                })}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GatePassCodeForm;
