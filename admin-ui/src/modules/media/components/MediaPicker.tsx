import { useState, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import useMedias from '../hooks/useMedias';
import InfiniteScroll from '../../common/components/InfiniteScroll';

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: { _id: string; name: string; url: string }) => void;
  types?: string[];
}

const MediaPicker = ({ open, onClose, onSelect, types }: MediaPickerProps) => {
  const { formatMessage } = useIntl();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [searchQuery]);

  const { medias, loading, hasMore, loadMore } = useMedias({
    limit: 24,
    queryString: debouncedQuery || null,
    types: types || null,
  });

  const handleSelect = (media) => {
    onSelect(media);
    onClose();
  };

  return (
    <Transition show={open}>
      <Dialog onClose={onClose} className="relative z-50">
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
              <DialogPanel className="relative w-full max-w-4xl transform overflow-hidden rounded-lg bg-surface shadow-2xl">
                <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
                  <h3 className="text-lg font-medium text-text-primary">
                    {formatMessage({
                      id: 'select_media',
                      defaultMessage: 'Select from media library',
                    })}
                  </h3>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md text-text-muted hover:text-text-secondary focus:outline-hidden focus:ring-2 focus:ring-focus-ring"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="px-6 py-3">
                  <input
                    type="text"
                    placeholder={formatMessage({
                      id: 'search_media',
                      defaultMessage: 'Search media...',
                    })}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-focus-ring focus:outline-hidden focus:ring-1 focus:ring-focus-ring"
                  />
                </div>

                <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
                  <InfiniteScroll
                    loading={loading}
                    hasMore={hasMore}
                    onLoadMore={loadMore}
                  >
                    {loading && medias?.length === 0 ? (
                      <Loading variant="list" />
                    ) : medias?.length === 0 ? (
                      <p className="py-8 text-center text-sm text-text-muted">
                        {formatMessage({
                          id: 'no_media_found',
                          defaultMessage: 'No media found',
                        })}
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {medias?.map((media) => {
                          const isImage = media.type?.startsWith('image');
                          return (
                            <button
                              key={media._id}
                              type="button"
                              onClick={() => handleSelect(media)}
                              className="group flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface text-left shadow-sm transition-all hover:border-focus-ring hover:shadow-md focus:outline-hidden focus:ring-2 focus:ring-focus-ring"
                            >
                              <div className="flex h-32 items-center justify-center bg-surface-subtle">
                                {isImage && media.url ? (
                                  <ImageWithFallback
                                    src={media.url}
                                    alt={media.name}
                                    width={160}
                                    height={128}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center gap-1 text-text-secondary">
                                    <DocumentTextIcon className="h-8 w-8" />
                                    <span className="text-xs uppercase">
                                      {media.type?.split('/')[1] || '?'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-1 p-2">
                                <span className="truncate text-xs font-medium text-text-primary">
                                  {media.name}
                                </span>
                                <Badge
                                  text={media.type?.split('/')[0]}
                                  square
                                  color="slate"
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </InfiniteScroll>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MediaPicker;
