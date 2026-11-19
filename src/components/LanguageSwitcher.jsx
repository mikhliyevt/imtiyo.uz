import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { code: 'uz', short: 'UZ', label: 'O‘zbekcha', flag: '🇺🇿' },
  { code: 'ru', short: 'RU', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', short: 'EN', label: 'English', flag: '🇬🇧' },
];

export default function LanguageSwitcher({ className }) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const onOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <div ref={boxRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Tilni tanlash"
        className="imtiyo-glass-pill inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 sm:px-3.5 text-[12.5px] font-bold text-[#08123A] hover:text-[#002D96] dark:text-slate-100 dark:hover:text-sky-300"
      >
        <Globe className="h-3.5 w-3.5 text-[#1D6FF2] dark:text-sky-400" />
        <span>{current.short}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-slate-400 transition-transform dark:text-slate-400',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-2xl border border-slate-200/95 bg-white/95 p-1.5 shadow-[0_20px_44px_-16px_rgba(0,45,150,0.35)] backdrop-blur-2xl dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-[0_20px_44px_-16px_rgba(0,0,0,0.7)]">
          {LANGUAGES.map((item) => {
            const active = item.code === lang;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setLang(item.code);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[12.5px] font-bold transition-colors',
                  active
                    ? 'bg-[#1D6FF2]/10 text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-[#08123A] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                )}
              >
                <span className="flex items-center gap-2">
                  <span>{item.flag}</span>
                  <span>
                    {item.short}{' '}
                    <span className="font-medium text-slate-400 dark:text-slate-400">
                      ({item.label})
                    </span>
                  </span>
                </span>
                {active && <Check className="h-3.5 w-3.5 text-[#1D6FF2] dark:text-sky-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
