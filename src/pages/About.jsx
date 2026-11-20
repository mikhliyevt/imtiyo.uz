import { useEffect, useState } from 'react';
import {
  Award,
  Building2,
  Image as ImageIcon,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useLang } from '@/lib/LanguageContext';
import { api, DEFAULT_SITE_CONTENT } from '@/services/api';

const LOCALIZED_ABOUT = {
  ru: {
    badge: 'О нас',
    title: 'Лучшая платформа скидок для студентов',
    subtitle:
      'IMTIYO — современная цифровая экосистема, объединяющая студентов Узбекистана с их любимыми брендами.',
    sections: [
      {
        heading: 'Наша миссия',
        body: 'Помогать каждому студенту Узбекистана экономить на питании, обучении, спорте, технологиях и отдыхе с помощью единой цифровой карты студента.',
      },
      {
        heading: 'Для брендов-партнёров',
        body: 'IMTIYO помогает компаниям выходить на активную молодёжную аудиторию, увеличивать лояльность и привлекать проверенных студентов в свои филиалы и приложения.',
      },
    ],
  },
  en: {
    badge: 'About us',
    title: 'The #1 student discounts platform',
    subtitle:
      'IMTIYO is a modern digital ecosystem connecting students across Uzbekistan with their favorite brands.',
    sections: [
      {
        heading: 'Our mission',
        body: 'Helping every student in Uzbekistan save on food, education, fitness, tech, and entertainment through a single free digital Student ID.',
      },
      {
        heading: 'For partner brands',
        body: 'IMTIYO connects businesses with an active university audience, boosting loyalty and bringing verified students directly to stores and apps.',
      },
    ],
  },
};

export default function About() {
  const { t, lang } = useLang();
  const [about, setAbout] = useState(DEFAULT_SITE_CONTENT.about);

  useEffect(() => {
    const load = () => {
      api.getSiteContent().then((c) => {
        if (c?.about) setAbout(c.about);
      });
    };
    load();
    window.addEventListener('imtiyo_content_changed', load);
    return () => window.removeEventListener('imtiyo_content_changed', load);
  }, []);

  const locAbout = LOCALIZED_ABOUT[lang] || about;

  return (
    <AppShell breadcrumbs={[{ label: t('nav.about') }]}>
      <div className="mx-auto max-w-5xl space-y-6 pb-8">
        {about.mode === 'html' && about.customHtml ? (
          <div
            className="prose max-w-none rounded-[30px] border border-slate-200/80 bg-white/95 p-7 text-[#08123A] shadow-sm backdrop-blur-xl dark:prose-invert dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-100"
            dangerouslySetInnerHTML={{ __html: about.customHtml }}
          />
        ) : about.mode === 'variant2' ? (
          <div className="space-y-5 rounded-[32px] border border-slate-200/80 bg-white/95 p-7 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 md:p-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#002D96]/10 px-3.5 py-1 text-[11.5px] font-extrabold text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300">
              <Sparkles className="h-3.5 w-3.5" />
              {about.badge || 'Biz haqimizda'}
            </span>
            <h1 className="text-[28px] font-black leading-tight text-[#08123A] dark:text-white md:text-[36px]">
              {about.title}
            </h1>
            <p className="text-[15px] leading-relaxed font-medium text-slate-600 dark:text-slate-300">
              {about.subtitle}
            </p>
            <div className="space-y-4 border-t border-slate-100 pt-5 dark:border-slate-800">
              {(about.sections || []).map((sec, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/70"
                >
                  <h2 className="text-[18px] font-extrabold text-[#002D96] dark:text-sky-300">
                    {sec.heading}
                  </h2>
                  <p className="mt-2 text-[13.5px] leading-relaxed font-medium text-slate-600 dark:text-slate-300">
                    {sec.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : about.mode === 'variant3' ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[30px] bg-gradient-to-br from-[#002D96] to-[#1D6FF2] p-7 text-white md:col-span-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold">
                {about.badge || 'IMTIYO'}
              </span>
              <h1 className="mt-3 text-[26px] font-black leading-tight md:text-[32px]">
                {about.title}
              </h1>
              <p className="mt-3 text-[13.5px] leading-relaxed text-white/85">{about.subtitle}</p>
            </div>
            <div className="flex flex-col justify-between rounded-[30px] border border-slate-200/80 bg-white/95 p-6 dark:border-slate-800 dark:bg-slate-900/90">
              <Award className="h-8 w-8 text-[#1D6FF2] dark:text-sky-400" />
              <div>
                <p className="text-[28px] font-black text-[#08123A] dark:text-white">50% gacha</p>
                <p className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400">
                  Tasdiqlangan talabalar uchun maxsus chegirmalar
                </p>
              </div>
            </div>
            {(about.sections || []).map((sec, idx) => (
              <div
                key={idx}
                className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 dark:border-slate-800 dark:bg-slate-900/90 md:col-span-1"
              >
                <h2 className="text-[17px] font-extrabold text-[#08123A] dark:text-white">
                  {sec.heading}
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {sec.body}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <>
            <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#002D96] via-[#1D6FF2] to-[#00A9FF] p-7 text-white shadow-[0_24px_60px_-28px_rgba(0,45,150,0.65)] md:p-10">
              <div className="grid items-center gap-8 md:grid-cols-2">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-[11.5px] font-bold backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5" />
                    {locAbout.badge || t('about.badge')}
                  </span>
                  <h1 className="mt-3 text-[28px] font-black leading-tight tracking-[-0.02em] md:text-[36px]">
                    {locAbout.title}
                  </h1>
                  <p className="mt-3 text-[14px] leading-relaxed text-white/85">
                    {locAbout.subtitle}
                  </p>
                </div>

                <div className="relative flex aspect-[16/10] w-full flex-col items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed border-white/35 bg-white/10 p-6 text-center backdrop-blur-md">
                  <ImageIcon className="h-10 w-10 text-white/70" />
                  <p className="mt-2 text-[13px] font-bold text-white">IMTIYO</p>
                  <span className="mt-0.5 text-[11px] text-white/70">1200 × 750 px</span>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
              {[
                { icon: Users, value: '100 000+', label: t('about.stat1') },
                { icon: Building2, value: '50+', label: t('about.stat2') },
                { icon: Award, value: t('about.discountValue'), label: t('about.stat3') },
                { icon: ShieldCheck, value: t('about.freeValue'), label: t('about.stat4') },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={idx}
                    className="rounded-[24px] border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#002D96]/10 text-[#002D96] dark:bg-sky-500/15 dark:text-sky-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-[22px] font-black text-[#08123A] dark:text-white">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </section>

            <section className="grid gap-5 md:grid-cols-2">
              {(locAbout.sections || []).map((sec, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90"
                >
                  <div>
                    <h2 className="text-[20px] font-extrabold text-[#08123A] dark:text-white">
                      {sec.heading}
                    </h2>
                    <p className="mt-2.5 text-[13.5px] leading-relaxed font-medium text-slate-600 dark:text-slate-300">
                      {sec.body}
                    </p>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
