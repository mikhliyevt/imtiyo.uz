import { Check, Languages } from 'lucide-react';
import SettingsTile from '@/components/settings/SettingsTile';
import { useLang } from '@/lib/LanguageContext';
import { languages } from '@/data/translations';
import { cn } from '@/lib/utils';

const NAMES = { uz: "O‘zbekcha", ru: 'Русский', en: 'English' };

export default function LanguageTile() {
  const { t, lang, setLang } = useLang();

  return (
    <SettingsTile icon={Languages} title={t('settings.language')} hint={t('settings.languageHint')}>
      <div className="space-y-2">
        {languages.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            className={cn(
              'flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-left transition-colors',
              lang === l.code ? 'bg-[#002D96]/10' : 'bg-slate-900/[0.04]'
            )}
          >
            <span className="text-[12.5px] font-semibold text-[#08123A]">{NAMES[l.code]}</span>
            {lang === l.code && <Check className="h-4 w-4 text-[#002D96]" />}
          </button>
        ))}
      </div>
    </SettingsTile>
  );
}