import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Mail,
  MessageSquare,
  Phone,
  Send,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/LanguageContext';
import { useStudent } from '@/lib/StudentContext';
import { useToast } from '@/components/ui/use-toast';
import { api, DEFAULT_FAQ_ITEMS } from '@/services/api';
import { cn } from '@/lib/utils';

const LOCALIZED_FAQ = {
  ru: [
    {
      id: 'faq-1',
      q: '1. Как подтвердить студенческий статус?',
      intro: 'Подтверждение занимает всего 1 минуту:',
      bullets: [
        'Перейдите в «Мой профиль» и нажмите «Подтвердить статус студента».',
        'Выберите регион и учебное заведение из списка.',
        'Загрузите студенческий билет или справку из HEMIS / my.gov.uz.',
        'После проверки ваш статус изменится на «Подтверждён».',
      ],
    },
    {
      id: 'faq-2',
      q: '2. Что делать, если QR-код или промокод не работает?',
      intro: 'Если возникла проблема при применении скидки:',
      bullets: [
        'Убедитесь, что в профиле активен статус «Подтверждённый студент».',
        'Покажите QR-код кассиру в течение 15 минут после активации.',
        'Если проблема сохраняется, напишите нам через форму ниже или в @imtiyosupport_bot.',
      ],
    },
    {
      id: 'faq-3',
      q: '3. Сколько раз можно пользоваться скидками?',
      intro: 'Условия зависят от выбранного партнёра:',
      bullets: [
        'Скидками в ресторанах и кафе можно пользоваться неограниченно весь период учёбы.',
        'Специальные разовые бонусы доступны один раз на каждый Student ID.',
      ],
    },
    {
      id: 'faq-4',
      q: '4. Моего университета нет в списке — что делать?',
      intro: 'Если вашего вуза нет в основном списке:',
      bullets: [
        'Выберите в списке пункт «Другое (нет в списке)» и введите полное название вашего вуза.',
        'После проверки мы добавим его в официальный каталог.',
      ],
    },
  ],
  en: [
    {
      id: 'faq-1',
      q: '1. How do I verify my student status?',
      intro: 'Verification takes just 1 minute:',
      bullets: [
        'Open "My profile" and click "Verify student status".',
        'Choose your region and search for your university.',
        'Upload your Student ID card or HEMIS / my.gov.uz certificate.',
        'Once reviewed, your account status becomes "Verified student".',
      ],
    },
    {
      id: 'faq-2',
      q: '2. What if my QR code or promo code does not work?',
      intro: 'If you have trouble redeeming a discount:',
      bullets: [
        'Make sure your profile shows the "Verified student" badge.',
        'Show the activated code to the cashier within 15 minutes.',
        'Still stuck? Message us using the form below or @imtiyosupport_bot on Telegram.',
      ],
    },
    {
      id: 'faq-3',
      q: '3. How many times can I use discounts?',
      intro: 'Usage limits depend on the partner offer:',
      bullets: [
        'Most restaurant and cafe deals can be used unlimited times while you are a student.',
        'Special one-time bonuses are valid once per Student ID.',
      ],
    },
    {
      id: 'faq-4',
      q: '4. What if my university is not on the list?',
      intro: 'If you cannot find your institution:',
      bullets: [
        'Select "Other (Not in list)" and type your institution name.',
        'Our team will review and add it to the official directory.',
      ],
    },
  ],
};

export default function Help() {
  const { t, lang } = useLang();
  const { profile } = useStudent();
  const { toast } = useToast();
  const [openIndex, setOpenIndex] = useState(0);

  const [category, setCategory] = useState('help');
  const [fullName, setFullName] = useState(profile?.name || '');
  const [contactInfo, setContactInfo] = useState(profile?.phone || profile?.email || '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (profile?.signedIn) {
      if (!fullName && profile.name) setFullName(profile.name);
      if (!contactInfo && (profile.phone || profile.email)) {
        setContactInfo(profile.phone || profile.email);
      }
    }
  }, [profile?.signedIn, profile?.name, profile?.phone, profile?.email]);

  const faqItems = LOCALIZED_FAQ[lang] || DEFAULT_FAQ_ITEMS;

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !message.trim()) return;
    setSending(true);
    try {
      await api.createSupportMessage({
        student_id: profile?.student_id || '',
        full_name: fullName.trim(),
        contact: contactInfo.trim(),
        email: profile?.email || '',
        category,
        message: message.trim(),
      });
      setMessage('');
      toast({
        title: t('help.sentToastTitle'),
        description: t('help.sentToastDesc'),
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell breadcrumbs={[{ label: t('nav.helpCenter') }]}>
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
        {/* 1-QISM: FAQ */}
        <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_50px_-30px_rgba(0,45,150,0.28)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#002D96]/10 text-[#002D96] dark:bg-sky-500/15 dark:text-sky-400">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-[22px] font-extrabold text-[#08123A] dark:text-white">
                {t('help.title')}
              </h1>
              <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
                {t('help.subtitle')}
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {faqItems.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={item.id || idx}
                  className={cn(
                    'overflow-hidden rounded-2xl border transition-all',
                    isOpen
                      ? 'border-[#1D6FF2]/45 bg-[#1D6FF2]/[0.05] dark:border-sky-500/40 dark:bg-sky-500/10'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-slate-700'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-[14px] font-extrabold text-[#08123A] dark:text-white"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-[#002D96] transition-transform duration-200 dark:text-sky-400',
                        isOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-100/80 px-4 pb-4 pt-3 text-[13px] leading-relaxed dark:border-slate-700/70">
                      {item.intro && (
                        <p className="font-bold text-[#08123A] dark:text-slate-100">
                          {item.intro}
                        </p>
                      )}
                      <ul className="mt-2.5 space-y-2">
                        {(item.bullets || []).map((b, bIdx) => (
                          <li
                            key={bIdx}
                            className="flex items-start gap-2.5 font-semibold text-slate-700 dark:text-slate-300"
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1D6FF2] dark:text-sky-400" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-QISM: XABAR / SHIKOYAT YUBORISH (TO'G'RIDAN-TO'G'RI ADMIN PANELGA BORADI) */}
        <div className="grid gap-5 md:grid-cols-5">
          <div className="space-y-3 rounded-[28px] bg-gradient-to-br from-[#002D96] via-[#1D6FF2] to-[#00A9FF] p-6 text-white shadow-md md:col-span-2">
            <h2 className="text-[19px] font-extrabold">{t('help.contactCardTitle')}</h2>
            <p className="text-[12.5px] leading-relaxed text-white/85">
              {t('help.contactCardDesc')}
            </p>

            <div className="space-y-3 pt-3 text-[13px]">
              <a
                href="https://t.me/imtiyosupport_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 font-bold backdrop-blur-md transition-colors hover:bg-white/25"
              >
                <Send className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-[11px] text-white/75">{t('help.telegramSupport')}</p>
                  <p>@imtiyosupport_bot</p>
                </div>
              </a>

              <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 font-bold backdrop-blur-md">
                <Phone className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-[11px] text-white/75">{t('help.hotline')}</p>
                  <p>+998 (71) 200-00-00</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 font-bold backdrop-blur-md">
                <Mail className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-[11px] text-white/75">{t('help.emailLabel')}</p>
                  <p>info@imtiyo.uz</p>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleContactSubmit}
            className="space-y-4 rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 md:col-span-3"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#1D6FF2] dark:text-sky-400" />
              <h3 className="text-[17px] font-extrabold text-[#08123A] dark:text-white">
                {t('help.formTitle')}
              </h3>
            </div>

            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                {t('help.topicLabel')}
              </label>
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                {[
                  { id: 'help', label: t('help.topicHelp') },
                  { id: 'complaint', label: t('help.topicComplaint') },
                  { id: 'suggestion', label: t('help.topicSuggestion') },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    className={cn(
                      'rounded-xl py-2 text-[11.5px] font-bold transition-all',
                      category === item.id
                        ? 'bg-white text-[#002D96] shadow-sm dark:bg-[#1D6FF2] dark:text-white'
                        : 'text-slate-500 hover:text-[#08123A] dark:text-slate-400 dark:hover:text-white'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                {t('help.nameLabel')}
              </label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('help.namePlaceholder')}
                className="imtiyo-help-input"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                {t('help.contactLabel')}
              </label>
              <input
                required
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder={t('help.contactPlaceholder')}
                className="imtiyo-help-input"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                {t('help.messageLabel')}
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('help.messagePlaceholder')}
                className="imtiyo-help-input resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={sending}
              className="h-11 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-extrabold text-white shadow-md"
            >
              <Send className="mr-2 h-4 w-4" />
              {sending ? t('help.sending') : t('help.send')}
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
