import { useState } from 'react';
import { useIntl } from 'react-intl';

const ExportTokenForm = ({ isOpen, addresses, cancel, onExport }) => {
  const [value, setValue] = useState('');
  const { formatMessage } = useIntl();
  return (
    isOpen && (
      <div
        className="relative z-10"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="fixed inset-0 bg-slate-500 bg-opacity/75 transition-opacity" />

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div>
                <fieldset className="space-y-5">
                  {addresses?.map((web3Address) => (
                    <div
                      key={web3Address.address}
                      className="relative flex items-start"
                    >
                      <div className="flex h-5 items-center">
                        <input
                          id={web3Address.address}
                          name="addresses"
                          value={web3Address.address}
                          onChange={() => {
                            setValue(web3Address.address);
                          }}
                          checked={
                            value?.toLowerCase() ===
                            web3Address.address?.toLowerCase()
                          }
                          type="checkbox"
                          className="h-4 w-4 rounded-sm border-slate-300 dark:border-slate-600 bg-white dark:!bg-slate-800 text-slate-950 focus:ring-slate-900"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="comments"
                          className="font-medium text-slate-700"
                        >
                          {web3Address.address}
                        </label>
                      </div>
                    </div>
                  ))}
                </fieldset>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="Address"
                  className="block text-sm font-medium text-slate-700"
                >
                  {formatMessage({
                    id: 'or_manually_enter_address',
                    defaultMessage: 'Or enter address manually',
                  })}
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    onChange={(e) => setValue(e.target.value)}
                    value={value}
                    name="Address"
                    id="Address"
                    className="block w-full rounded-md border-slate-300 shadow-xs focus:border-slate-900 focus:ring-slate-900 sm:text-sm"
                    placeholder="0xF5F72AE7fa1fa990ebaF163208Ed7aD6a3f42DEA"
                  />
                </div>
              </div>

              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => onExport(value)}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-slate-950 px-4 py-2 text-base font-medium text-white shadow-xs hover:bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                >
                  {formatMessage({ id: 'export', defaultMessage: 'Export' })}
                </button>
                <button
                  type="button"
                  onClick={cancel}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-700 shadow-xs hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                >
                  {formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default ExportTokenForm;
