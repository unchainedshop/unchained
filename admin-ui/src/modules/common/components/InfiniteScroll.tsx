import { useEffect, useRef, useCallback } from 'react';
import Loading from './Loading';

interface InfiniteScrollProps {
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  children: React.ReactNode;
  threshold?: number;
}

const InfiniteScroll = ({
  loading,
  hasMore,
  onLoadMore,
  children,
  threshold = 200,
}: InfiniteScrollProps) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: `${threshold}px`,
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersect, threshold]);

  return (
    <>
      {children}
      <div ref={sentinelRef} className="h-4" />
      {loading && (
        <div className="flex justify-center py-4">
          <Loading />
        </div>
      )}
    </>
  );
};

export default InfiniteScroll;
