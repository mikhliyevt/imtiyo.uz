export function PageRouteSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#070d1f]">
      <div className="h-16 border-b border-slate-200/70 bg-white/80 dark:border-slate-800 dark:bg-[#0b1228]/80" />
      <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 md:px-8">
        <div className="h-4 w-48 animate-pulse rounded-full bg-slate-200/80 dark:bg-slate-800" />
        <div className="h-9 w-72 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-56 animate-pulse rounded-[26px] bg-slate-200/70 dark:bg-slate-800/80" />
          <div className="hidden h-56 animate-pulse rounded-[26px] bg-slate-200/70 dark:bg-slate-800/80 md:block" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-[22px] bg-slate-200/65 dark:bg-slate-800/75"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomeGridSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-[250px] animate-pulse rounded-[26px] bg-slate-200/70 dark:bg-slate-800/80 md:h-[270px]" />
        <div className="hidden h-[270px] animate-pulse rounded-[26px] bg-slate-200/70 dark:bg-slate-800/80 md:block" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex w-[104px] shrink-0 flex-col items-center gap-2">
            <div className="h-[104px] w-[104px] animate-pulse rounded-[22px] bg-slate-200/70 dark:bg-slate-800/80" />
            <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-800/80" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-[22px] border border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-44 animate-pulse bg-slate-200/70 dark:bg-slate-800" />
            <div className="space-y-2.5 p-4">
              <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-800" />
              <div className="h-4 w-full animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-800" />
              <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
