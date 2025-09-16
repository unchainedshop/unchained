import React, { type JSX } from 'react';

type SetModal = (
  children: JSX.Element | string,
  options?: { closeOnOutsideClick?: boolean },
) => Promise<boolean>;

const ModalContext = React.createContext<{ setModal: SetModal }>({
  setModal: () => {
    throw new Error('No ModalContext/ModalWrapper ancestor found.');
  },
});

export default ModalContext;
