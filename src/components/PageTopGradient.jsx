import { cn } from '@/lib/utils';

/**
 * Global subtle top gradient band that blends softly into white (light mode)
 * or deep navy #070d1f (dark mode), inspired by modern student-perks platforms.
 */
export default function PageTopGradient({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 z-0 h-[260px] overflow-hidden select-none',
        className
      )}
    >
      {/* Light mode soft pastel mesh fading cleanly into pure white */}
      <div
        className="h-full w-full dark:hidden"
        style={{
          background:
            'radial-gradient(62% 90% at 14% 0%, rgba(124, 92, 255, 0.16) 0%, rgba(29, 111, 242, 0.10) 42%, rgba(255, 255, 255, 0) 100%), ' +
            'radial-gradient(58% 85% at 52% 0%, rgba(0, 169, 255, 0.13) 0%, rgba(255, 255, 255, 0) 100%), ' +
            'radial-gradient(60% 88% at 88% 0%, rgba(255, 166, 146, 0.18) 0%, rgba(255, 255, 255, 0) 100%), ' +
            'linear-gradient(180deg, rgba(243, 246, 255, 0.72) 0%, rgba(255, 255, 255, 0) 100%)',
        }}
      />

      {/* Dark mode atmospheric brand glow fading cleanly into #070d1f */}
      <div
        className="hidden h-full w-full dark:block"
        style={{
          background:
            'radial-gradient(60% 90% at 15% 0%, rgba(91, 33, 182, 0.26) 0%, rgba(7, 13, 31, 0) 100%), ' +
            'radial-gradient(56% 85% at 52% 0%, rgba(29, 111, 242, 0.24) 0%, rgba(7, 13, 31, 0) 100%), ' +
            'radial-gradient(55% 85% at 88% 0%, rgba(0, 169, 255, 0.16) 0%, rgba(7, 13, 31, 0) 100%), ' +
            'linear-gradient(180deg, rgba(15, 26, 58, 0.55) 0%, rgba(7, 13, 31, 0) 100%)',
        }}
      />
    </div>
  );
}
