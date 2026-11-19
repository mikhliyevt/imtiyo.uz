import { AlertTriangle } from 'lucide-react';

const MARQUEE_TEXT =
  '⚠️ Diqqat: Sayt hozirda test rejimida ishlamoqda, hech qaysi aksiya va chegirmalar hozircha faol emas.';

export default function TopMarqueeBanner() {
  const items = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div className="relative z-40 w-full overflow-hidden border-b border-amber-300/60 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white shadow-sm dark:border-amber-500/30 dark:from-amber-600 dark:via-orange-600 dark:to-amber-600">
      <div className="imtiyo-marquee-track flex w-max items-center py-1.5">
        {items.map((idx) => (
          <div
            key={idx}
            className="mx-8 flex shrink-0 items-center gap-2 text-[12px] font-extrabold tracking-wide"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-100" />
            <span>{MARQUEE_TEXT}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
