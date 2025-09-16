import React, { useState, useMemo } from 'react';

import Modal from './Modal';
import ModalContext from '../utils/ModalContext';

const ModalWrapper = ({ children }) => {
  const [modalChildren, setChildren] = useState(null);
  const [closeOnOutsideClick, setCloseOnOutsideClick] = useState(false);
  const hideModal = () => setChildren(null);
  const [onClose, setOnClose] = useState(() => hideModal);

  const ctx = useMemo(() => {
    const setModal = (
      newModalChildren,
      { closeOnOutsideClick: newCloseOnOutsideClick = false } = {},
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        if (!newModalChildren) {
          resolve(true);
        }

        setCloseOnOutsideClick(newCloseOnOutsideClick);
        setChildren(() => newModalChildren);
        setOnClose(() => () => {
          hideModal();
          resolve(true);
        });
      });
    };
    return { setModal };
  }, []);

  return (
    <>
      <Modal
        visible={!!modalChildren}
        onClose={onClose}
        closeOnOutsideClick={closeOnOutsideClick}
      >
        {modalChildren}
      </Modal>
      <ModalContext.Provider value={ctx}>{children}</ModalContext.Provider>
    </>
  );
};

export default ModalWrapper;
