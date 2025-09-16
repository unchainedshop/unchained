import classNames from 'classnames';
import { useIntl } from 'react-intl';
import ImageWithFallback from './ImageWithFallback';
import NoImage from './NoImage';

const MediaAvatar = ({ file, className = '' }) => {
  const { formatMessage } = useIntl();
  return (
    <div className={classNames('h-10 w-10 shrink-0', className)}>
      {file ? (
        <ImageWithFallback
          className="relative h-10 w-10 rounded-sm"
          src={file.url}
          width={100}
          height={100}
          alt={formatMessage({
            id: 'image_not_available',
            defaultMessage: 'Image not available',
          })}
        />
      ) : (
        <NoImage />
      )}
    </div>
  );
};

export default MediaAvatar;
