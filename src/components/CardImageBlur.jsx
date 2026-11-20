import { cn } from '@/lib/utils';

/**
 * Progressive 3-layer edge blur for offer/deal card images.
 * Each blur layer is physically bounded inside the outer 25% of the image
 * (bottom 25% or right 25%), preventing hover scale transitions from ever
 * blurring the crisp 75% body of the photo.
 *
 * @param {'bottom' | 'right' | 'bottom-sm-right'} direction
 */
export default function CardImageBlur({ direction = 'bottom', className }) {
  const showBottom = direction === 'bottom' || direction === 'bottom-sm-right';
  const showRight = direction === 'right' || direction === 'bottom-sm-right';

  return (
    <>
      {showBottom && (
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 h-full overflow-hidden',
            direction === 'bottom-sm-right' && 'sm:hidden',
            className
          )}
        >
          <div className="imtiyo-card-blur-strip imtiyo-card-blur-bottom-1" />
          <div className="imtiyo-card-blur-strip imtiyo-card-blur-bottom-2" />
          <div className="imtiyo-card-blur-strip imtiyo-card-blur-bottom-3" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[25%] bg-gradient-to-t from-white/95 via-white/45 to-transparent dark:from-slate-900/95 dark:via-slate-900/50 dark:to-transparent" />
        </div>
      )}

      {showRight && (
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-y-0 right-0 w-full overflow-hidden',
            direction === 'bottom-sm-right' && 'hidden sm:block',
            className
          )}
        >
          <div className="imtiyo-card-blur-strip imtiyo-card-blur-right-1" />
          <div className="imtiyo-card-blur-strip imtiyo-card-blur-right-2" />
          <div className="imtiyo-card-blur-strip imtiyo-card-blur-right-3" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[25%] bg-gradient-to-l from-white/95 via-white/45 to-transparent dark:from-slate-900/95 dark:via-slate-900/50 dark:to-transparent" />
        </div>
      )}
    </>
  );
}
