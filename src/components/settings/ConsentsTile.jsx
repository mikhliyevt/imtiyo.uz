import { useState } from 'react';
import { Bell } from 'lucide-react';
import SettingsTile from '@/components/settings/SettingsTile';
import { Switch } from '@/components/ui/switch';
import { useLang } from '@/lib/LanguageContext';

const CONSENTS = [
  { key: 'imtiyo_push', label: 'settings.push' },
  { key: 'imtiyo_sms', label: 'settings.sms' },
  { key: 'imtiyo_promo', label: 'settings.promoEmail' },
];

export default function ConsentsTile() {
  const { t } = useLang();
  const [state, setState] = useState(() =>
    Object.fromEntries(
      CONSENTS.map((c) => [c.key, localStorage.getItem(c.key) === '1'])
    )
  );

  const toggle = (key, value) => {
    setState((s) => ({ ...s, [key]: value }));
    localStorage.setItem(key, value ? '1' : '0');
  };

  return (
    <SettingsTile icon={Bell} title={t('settings.consents')} hint={t('settings.consentsHint')}>
      <div className="space-y-2">
        {CONSENTS.map((c) => (
          <div
            key={c.key}
            className="flex items-center justify-between gap-3 rounded-2xl bg-slate-900/[0.04] px-3.5 py-3"
          >
            <span className="text-[12.5px] font-semibold text-[#08123A]">{t(c.label)}</span>
            <Switch
              checked={!!state[c.key]}
              onCheckedChange={(v) => toggle(c.key, v)}
              className="h-[20px] w-9 data-[state=checked]:bg-[#002D96]"
            />
          </div>
        ))}
      </div>
    </SettingsTile>
  );
}