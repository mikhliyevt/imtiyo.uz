import { cn } from '@/lib/utils';

export default function Logo({ size = 'md', className }) {
  const sizes = {
    sm: { box: 'h-8 w-8 rounded-[10px]', text: 'text-[17px]', sub: 'text-[8px]' },
    md: { box: 'h-9 w-9 rounded-[12px]', text: 'text-[19px]', sub: 'text-[9px]' },
    lg: { box: 'h-11 w-11 rounded-[14px]', text: 'text-[22px]', sub: 'text-[10px]' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 bg-transparent select-none',
        className
      )}
    >
      <div
        className={cn(
          'relative grid shrink-0 place-items-center overflow-hidden shadow-[0_8px_20px_-6px_rgba(0,45,150,0.55)]',
          s.box
        )}
      >
        <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="imtiyoLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0A66FF" />
              <stop offset="100%" stopColor="#002D96" />
            </linearGradient>
          </defs>
          <rect width="120" height="120" rx="26" fill="url(#imtiyoLogoGrad)" />
          <path d="M57 32 L88 45 L57 58 L26 45 Z" fill="#FFFFFF" />
          <path
            d="M34 86 V64 C34 59 40 57 44 61 L57 72 L72 59 C76 55 83 58 83 64 V68"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="10.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g transform="translate(69, 64) rotate(-14)">
            <rect x="0" y="0" width="22" height="28" rx="6" fill="#E8F1FF" />
            <circle cx="7" cy="9" r="2.2" fill="#0039B3" />
            <circle cx="15" cy="19" r="2.2" fill="#0039B3" />
            <line
              x1="15.5"
              y1="8.5"
              x2="6.5"
              y2="19.5"
              stroke="#0039B3"
              strokeWidth="2.3"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>

      <div className="flex flex-col leading-none">
        <span
          className={cn(
            'font-black tracking-[-0.03em] text-[#002D96] dark:text-white',
            s.text
          )}
        >
          IMTIYO
        </span>
        <span
          className={cn(
            'mt-0.5 font-bold uppercase tracking-[0.16em] text-[#1D6FF2]',
            s.sub
          )}
        >
          Talabalar uchun
        </span>
      </div>
    </div>
  );
}