import React from 'react';
import { useIntl } from 'react-intl';
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from '@headlessui/react';

interface ModalProps {
  onClose?: () => void;
  children?: React.ReactNode;
  visible?: boolean;
  closeOnOutsideClick?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  onClose: close,
  children,
  visible = false,
  closeOnOutsideClick = false,
}) => {
  const intl = useIntl();

  const handleClose = () => {
    if (closeOnOutsideClick && close) {
      close();
    }
  };

  return (
    <Transition show={visible}>
      <Dialog onClose={handleClose} className="relative z-50">
        <TransitionChild
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            aria-hidden="true"
          />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <DialogPanel className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-surface px-4 pt-5 pb-4 text-left shadow-2xl sm:p-6">
                <div className="absolute top-0 right-0 pt-4 pr-4 sm:block">
                  <button
                    id="modal_close"
                    type="button"
                    onClick={close}
                    className="rounded-md bg-surface-input text-text-muted hover:text-text-secondary focus:outline-hidden focus:ring-2 focus:ring-focus-ring focus:ring-offset-2"
                  >
                    <span className="sr-only">
                      {intl.formatMessage({
                        id: 'close',
                        defaultMessage: 'Close',
                      })}
                    </span>
                    <svg
                      className="h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                {children && React.isValidElement(children)
                  ? React.cloneElement(children as React.ReactElement<any>, {
                      close,
                    })
                  : children}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
