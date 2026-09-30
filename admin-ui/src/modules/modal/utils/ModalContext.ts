import React, { type JSX } from 'react';
import sharedContext from '../../common/utils/sharedContext';

type SetModal = (
  children: JSX.Element | string,
  options?: { closeOnOutsideClick?: boolean },
) => Promise<boolean>;

const ModalContext = sharedContext(
  'ModalContext',
  React.createContext<{ setModal: SetModal }>({
    setModal: () => {
      throw new Error('No ModalContext/ModalWrapper ancestor found.');
    },
  }),
);

export default ModalContext;
