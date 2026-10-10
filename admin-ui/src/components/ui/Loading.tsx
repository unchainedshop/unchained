const Skeleton = ({ className = '' }: { className?: string }) => (
  <div
    className={`animate-pulse rounded bg-slate-200 dark:bg-slate-700 ${className}`}
  />
);

const ListSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    <div className="flex gap-4 py-3 border-b border-border-default">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/6" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 py-3">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/6" />
      </div>
    ))}
  </div>
);

const DetailSkeleton = () => (
  <div className="space-y-6 mt-4">
    <div className="flex flex-wrap gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
    <div className="flex gap-4 border-b border-border-default pb-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-20" />
      ))}
    </div>
    <div className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

const FormSkeleton = () => (
  <div className="space-y-5 mt-6 sm:max-w-xl mx-auto">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    ))}
    <Skeleton className="h-10 w-32 rounded-md" />
  </div>
);

const ContentSkeleton = () => (
  <div className="space-y-4 py-5">
    <Skeleton className="h-5 w-48" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-32 w-full mt-2" />
  </div>
);

type LoadingVariant = 'list' | 'detail' | 'form' | 'content';

const variantMap: Record<LoadingVariant, React.FC> = {
  list: ListSkeleton,
  detail: DetailSkeleton,
  form: FormSkeleton,
  content: ContentSkeleton,
};

const Loading = ({ variant = 'content' }: { variant?: LoadingVariant }) => {
  const VariantComponent = variantMap[variant];
  return (
    <div className="w-full" role="status" aria-label="Loading">
      <VariantComponent />
    </div>
  );
};

export { Skeleton };
export default Loading;
