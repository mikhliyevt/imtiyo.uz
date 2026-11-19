import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Unified top-left Breadcrumb component used across every page.
 * Each item: { label: string, to?: string, onClick?: () => void }
 * The final item is always rendered as the active non-clickable current page.
 */
export default function PageBreadcrumb({ items = [], rootLabel = 'Bosh sahifa', rootTo = '/', className }) {
  const normalized =
    items.length > 0 && items[0]?.isRoot
      ? items
      : [{ label: rootLabel, to: rootTo, isRoot: true }, ...items];

  return (
    <nav
      aria-label="Yo‘nalish"
      className={cn(
        'mb-4 flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-slate-600 dark:text-slate-400',
        className
      )}
    >
      {normalized.map((item, idx) => {
        const isLast = idx === normalized.length - 1;
        const isFirst = idx === 0;

        return (
          <span key={`${item.label}-${idx}`} className="inline-flex items-center gap-1.5 min-w-0">
            {idx > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
            )}

            {isLast ? (
              <span
                aria-current="page"
                className="inline-flex items-center gap-1.5 truncate font-extrabold text-[#1D6FF2] dark:text-sky-400"
              >
                {isFirst && <Home className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">{item.label}</span>
              </span>
            ) : item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                className="inline-flex items-center gap-1.5 truncate text-slate-700 transition-colors hover:text-[#002D96] dark:text-slate-300 dark:hover:text-sky-300"
              >
                {isFirst && <Home className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">{item.label}</span>
              </button>
            ) : (
              <Link
                to={item.to || '/'}
                className="inline-flex items-center gap-1.5 truncate text-slate-700 transition-colors hover:text-[#002D96] dark:text-slate-300 dark:hover:text-sky-300"
              >
                {isFirst && <Home className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">{item.label}</span>
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
