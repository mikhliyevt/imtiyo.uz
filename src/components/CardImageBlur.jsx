import { cn } from '@/lib/utils';

/**
 * Progressive 3-layer edge blur for offer/deal card images.
 * Starts smoothly from the outer 25% of the image (bottom or right edge),
 * matching the hero carousel's progressive blur aesthetics in Light & Dark modes.
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
            'pointer-events-none absolute inset-0',
            direction === 'bottom-sm-right' && 'sm:hidden',
            className
          )}
        >
          <div className="imtiyo-blur-layer imtiyo-card-blur-bottom-1" />
          <div className="imtiyo-blur-layer imtiyo-card-blur-bottom-2" />
          <div className="imtiyo-blur-layer imtiyo-card-blur-bottom-3" />
          <div className="absolute inset-x-0 bottom-0 h-[25%] bg-gradient-to-t from-white/95 via-white/45 to-transparent dark:from-slate-900/95 dark:via-slate-900/50 dark:to-transparent" />
        </div>
      )}

      {showRight && (
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0',
            direction === 'bottom-sm-right' && 'hidden sm:block',
            className
          )}
        >
          <div className="imtiyo-blur-layer imtiyo-card-blur-right-1" />
          <div className="imtiyo-blur-layer imtiyo-card-blur-right-2" />
          <div className="imtiyo-blur-layer imtiyo-card-blur-right-3" />
          <div className="absolute inset-y-0 right-0 w-[25%] bg-gradient-to-l from-white/95 via-white/45 to-transparent dark:from-slate-900/95 dark:via-slate-900/50 dark:to-transparent" />
        </div>
      )}
    </>
  );
}
