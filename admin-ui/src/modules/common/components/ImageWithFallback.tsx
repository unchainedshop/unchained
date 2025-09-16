import Image from 'next/image';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import defaultNextImageLoader from '../utils/defaultNextImageLoader';
import NoImageSvg from './NoImageSvg';

const ImageWithFallback = ({ fallbackSrc = '', src, ...props }) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const { formatMessage } = useIntl();

  // If there's an error or no src, show SVG fallback
  if (hasError || !imageSrc) {
    return (
      <div
        className={
          props.className ||
          'w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800'
        }
      >
        <NoImageSvg
          width={props.width || 200}
          height={props.height || 200}
          className="max-w-full max-h-full"
        />
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      loader={defaultNextImageLoader}
      alt={formatMessage({
        id: 'image-not-found',
        defaultMessage: 'Image not found',
      })}
      {...props}
      onError={() => {
        if (fallbackSrc && imageSrc !== fallbackSrc) {
          setImageSrc(fallbackSrc);
        } else {
          setHasError(true);
        }
      }}
    />
  );
};

export default ImageWithFallback;
