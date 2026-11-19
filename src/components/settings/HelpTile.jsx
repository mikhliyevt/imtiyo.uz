import { LifeBuoy, Send } from 'lucide-react';
import SettingsTile from '@/components/settings/SettingsTile';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useLang } from '@/lib/LanguageContext';

const FAQ = [
  { q: 'settings.faq1q', a: 'settings.faq1a' },
  { q: 'settings.faq2q', a: 'settings.faq2a' },
  { q: 'settings.faq3q', a: 'settings.faq3a' },
];

export default function HelpTile() {
  const { t } = useLang();

  return (
    <SettingsTile icon={LifeBuoy} title={t('settings.help')} hint={t('settings.helpHint')}>
      <Accordion type="single" collapsible className="space-y-2">
        {FAQ.map((item) => (
          <AccordionItem
            key={item.q}
            value={item.q}
            className="rounded-2xl border-0 bg-slate-900/[0.04] px-3.5"
          >
            <AccordionTrigger className="text-left text-[12px] font-bold text-[#08123A] hover:no-underline">
              {t(item.q)}
            </AccordionTrigger>
            <AccordionContent className="text-[11.5px] leading-relaxed text-slate-600">
              {t(item.a)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <a
        href="https://t.me/imtiyo_support"
        target="_blank"
        rel="noreferrer"
        className="mt-3 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] py-3 text-[12px] font-bold text-white"
      >
        <Send className="h-3.5 w-3.5" />
        {t('settings.support')}
      </a>
    </SettingsTile>
  );
}