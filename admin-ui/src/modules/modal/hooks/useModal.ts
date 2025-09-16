import { useContext } from 'react';
import ModalContext from '../utils/ModalContext';

const useModal = () => {
  return useContext(ModalContext);
};

export default useModal;
