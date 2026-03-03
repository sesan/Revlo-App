export function SkeletonLine({ width = '100%', height = '14px' }: { width?: string; height?: string }) {
  return (
    <div
      className="bg-bg-hover rounded-md animate-pulse"
      style={{ width, height }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-bg-surface border border-border rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-start">
        <SkeletonLine width="120px" height="14px" />
        <SkeletonLine width="60px" height="20px" />
      </div>
      <SkeletonLine width="90%" height="14px" />
      <SkeletonLine width="70%" height="14px" />
      <SkeletonLine width="80px" height="12px" />
    </div>
  );
}

export function SkeletonVerse() {
  return (
    <div className="flex items-start mb-2">
      <div className="mr-2 mt-1.5 min-w-[16px] shrink-0">
        <SkeletonLine width="14px" height="14px" />
      </div>
      <div className="flex-1 space-y-2">
        <SkeletonLine width="100%" height="16px" />
        <SkeletonLine width="85%" height="16px" />
        <SkeletonLine width="60%" height="16px" />
      </div>
    </div>
  );
}
