import { FileText } from 'lucide-react';
import SettingsTile from '@/components/settings/SettingsTile';
import { useLang } from '@/lib/LanguageContext';

export default function TermsTile() {
  const { t } = useLang();

  return (
    <SettingsTile icon={FileText} title={t('settings.terms')} hint={t('settings.termsHint')}>
      <div className="space-y-3 text-[12px] leading-relaxed text-slate-600">
        <p>{t('settings.termsBody')}</p>
        <h3 className="text-[12.5px] font-extrabold text-[#08123A]">{t('settings.terms')}</h3>
        <ul className="list-disc space-y-1.5 pl-4">
          <li>{t('settings.faq1a')}</li>
          <li>{t('settings.faq2a')}</li>
          <li>{t('settings.faq3a')}</li>
        </ul>
      </div>
    </SettingsTile>
  );
}