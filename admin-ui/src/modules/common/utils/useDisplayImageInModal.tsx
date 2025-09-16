import { useIntl } from 'react-intl';
import useModal from '../../modal/hooks/useModal';
import ImageWithFallback from '../components/ImageWithFallback';

const useDisplayImageInModal = () => {
  const { setModal } = useModal();
  const { formatMessage } = useIntl();
  const displayImageInModal = ({ url, closeOnOutsideClick = true }) => {
    setModal(
      <div className="flex h-96 w-96">
        <ImageWithFallback
          src={url}
          alt={formatMessage({
            id: 'image-not-found',
            defaultMessage: 'Image not found',
          })}
          className="absolute top-0 left-0 -z-10 h-full w-full grow object-contain object-center"
          layout="fill"
        />
      </div>,
      { closeOnOutsideClick },
    );
  };
  return {
    displayImageInModal,
  };
};

export default useDisplayImageInModal;
