import { useEffect, useRef } from 'react';
import Loading from '@/components/ui/Loading';

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
  const loadingRef = useRef(loading);
  const hasMoreRef = useRef(hasMore);
  const onLoadMoreRef = useRef(onLoadMore);

  loadingRef.current = loading;
  hasMoreRef.current = hasMore;
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreRef.current && !loadingRef.current) {
          onLoadMoreRef.current();
        }
      },
      { rootMargin: `${threshold}px` },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <>
      {children}
      {hasMore && <div ref={sentinelRef} className="h-4" />}
      {loading && (
        <div className="flex justify-center py-4">
          <Loading />
        </div>
      )}
    </>
  );
};

export default InfiniteScroll;
