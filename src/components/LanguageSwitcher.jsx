import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { code: 'uz', short: 'UZ', label: 'O‘zbekcha', flag: '🇺🇿' },
  { code: 'ru', short: 'RU', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', short: 'EN', label: 'English', flag: '🇬🇧' },
];

export default function LanguageSwitcher() {
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
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 px-3.5 text-[12.5px] font-bold text-[#08123A] shadow-[0_6px_18px_-12px_rgba(0,45,150,0.45)] transition-all hover:border-[#1D6FF2]/50 hover:text-[#002D96]"
      >
        <Globe className="h-3.5 w-3.5 text-[#1D6FF2]" />
        <span>{current.short}</span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-slate-400 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-[0_20px_44px_-16px_rgba(0,45,150,0.45)]">
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
                    ? 'bg-[#002D96]/8 text-[#002D96]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#08123A]'
                )}
              >
                <span className="flex items-center gap-2">
                  <span>{item.flag}</span>
                  <span>
                    {item.short} <span className="font-medium text-slate-400">({item.label})</span>
                  </span>
                </span>
                {active && <Check className="h-3.5 w-3.5 text-[#1D6FF2]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}