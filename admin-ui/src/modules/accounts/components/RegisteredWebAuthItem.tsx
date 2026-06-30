import { useIntl } from 'react-intl';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { TrashIcon } from '@heroicons/react/20/solid';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import defaultNextImageLoader from '../../common/utils/defaultNextImageLoader';
import useFormatDateTime from '../../common/utils/useFormatDateTime';

const RegisteredWebAuthItem = ({
  _id,
  aaguid,
  counter,
  created,
  md5Metadata,
  onRemoveCredential,
  removeDisabled,
}) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  return (
    <li className="col-span-1 flex shadow-xs rounded-md ">
      {md5Metadata?.icon && (
        <div className="shrink-0 flex items-center justify-center w-16  text-sm font-medium rounded-l-md">
          <ImageWithFallback
            className="inline-block h-10 w-10 rounded-full border-1"
            src={md5Metadata?.icon}
            loader={defaultNextImageLoader}
            width={36}
            height={36}
            alt={formatMessage({
              id: 'web_auth_icon',
              defaultMessage: 'Auth icon',
            })}
          />
        </div>
      )}
      <div className="flex-1 flex items-center justify-between border-t border-r border-b border-slate-300 dark:bg-slate-800 bg-white rounded-r-md truncate dark:text-slate-200">
        <div className="flex-1 px-4 py-2 text-sm truncate">
          <span className="text-text-primary font-medium ">{aaguid}</span>
          <div className="mt-1 mb-1">{md5Metadata?.description}</div>
          <div>
            <Badge text={counter} />
          </div>
        </div>
        <div className="shrink-0 pr-2 justify-between h-100  text-right">
          <div>{formatDateTime(created)}</div>
          {!removeDisabled && (
            <div className="align-bottom">
              <Button
                variant="danger"
                size="xs"
                rounded="full"
                icon={<TrashIcon className="h-5 w-5" />}
                onClick={() => onRemoveCredential(_id)}
              />
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

export default RegisteredWebAuthItem;
