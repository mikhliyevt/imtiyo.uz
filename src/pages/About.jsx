import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Building2,
  CheckCircle2,
  Image as ImageIcon,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { api, DEFAULT_SITE_CONTENT } from '@/services/api';

export default function About() {
  const navigate = useNavigate();
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

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/85 px-4 py-2 text-[12.5px] font-bold text-[#002D96] shadow-xs backdrop-blur-xl transition-all hover:border-[#1D6FF2] hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Orqaga</span>
          </button>
        </div>

        {/* 4-VARIANT: MAXSUS HTML FORMATI */}
        {about.mode === 'html' && about.customHtml ? (
          <div
            className="prose max-w-none rounded-[30px] border border-white/80 bg-white/90 p-7 text-[#08123A] shadow-xs backdrop-blur-xl"
            dangerouslySetInnerHTML={{ __html: about.customHtml }}
          />
        ) : about.mode === 'variant2' ? (
          /* 2-VARIANT: EXECUTIVE / MAQOLA USLUBI */
          <div className="space-y-5 rounded-[32px] border border-white/80 bg-white/90 p-7 shadow-xs backdrop-blur-xl md:p-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#002D96]/10 px-3.5 py-1 text-[11.5px] font-extrabold text-[#002D96]">
              <Sparkles className="h-3.5 w-3.5" />
              {about.badge || 'Biz haqimizda'}
            </span>
            <h1 className="text-[28px] font-black leading-tight text-[#08123A] md:text-[36px]">
              {about.title}
            </h1>
            <p className="text-[15px] leading-relaxed font-medium text-slate-600">
              {about.subtitle}
            </p>
            <div className="space-y-4 border-t border-slate-100 pt-5">
              {(about.sections || []).map((sec, idx) => (
                <div key={idx} className="rounded-2xl bg-slate-50 p-5">
                  <h2 className="text-[18px] font-extrabold text-[#002D96]">{sec.heading}</h2>
                  <p className="mt-2 text-[13.5px] leading-relaxed font-medium text-slate-600">
                    {sec.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : about.mode === 'variant3' ? (
          /* 3-VARIANT: MODERN BENTO GRID USLUBI */
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
            <div className="flex flex-col justify-between rounded-[30px] border border-white/80 bg-white/90 p-6">
              <Award className="h-8 w-8 text-[#1D6FF2]" />
              <div>
                <p className="text-[28px] font-black text-[#08123A]">50% gacha</p>
                <p className="text-[12.5px] font-semibold text-slate-500">
                  Tasdiqlangan talabalar uchun maxsus chegirmalar
                </p>
              </div>
            </div>
            {(about.sections || []).map((sec, idx) => (
              <div
                key={idx}
                className="rounded-[28px] border border-white/80 bg-white/90 p-6 md:col-span-1"
              >
                <h2 className="text-[17px] font-extrabold text-[#08123A]">{sec.heading}</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{sec.body}</p>
              </div>
            ))}
          </div>
        ) : (
          /* 1-VARIANT (STANDART): HERO BANNER + STATISTIKA + 2 USTUNLI BLOK */
          <>
            <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#002D96] via-[#1D6FF2] to-[#00A9FF] p-7 text-white shadow-[0_24px_60px_-28px_rgba(0,45,150,0.65)] md:p-10">
              <div className="grid items-center gap-8 md:grid-cols-2">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-[11.5px] font-bold backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5" />
                    {about.badge || 'Biz haqimizda'}
                  </span>
                  <h1 className="mt-3 text-[28px] font-black leading-tight tracking-[-0.02em] md:text-[36px]">
                    {about.title}
                  </h1>
                  <p className="mt-3 text-[14px] leading-relaxed text-white/85">
                    {about.subtitle}
                  </p>
                </div>

                <div className="relative flex aspect-[16/10] w-full flex-col items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed border-white/35 bg-white/10 p-6 text-center backdrop-blur-md">
                  <ImageIcon className="h-10 w-10 text-white/70" />
                  <p className="mt-2 text-[13px] font-bold text-white">
                    Platforma / Talabalar asosiy rasmi
                  </p>
                  <span className="mt-0.5 text-[11px] text-white/70">1200 × 750 px</span>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
              {[
                { icon: Users, value: '100 000+', label: 'Faol talabalar maqsadi' },
                { icon: Building2, value: '50+', label: 'Hamkor brend va tarmoqlar' },
                { icon: Award, value: '50% gacha', label: 'Eksklyuziv chegirmalar' },
                { icon: ShieldCheck, value: '100% Bepul', label: 'Talabalar uchun obunasiz' },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={idx}
                    className="rounded-[24px] border border-white/80 bg-white/85 p-5 shadow-xs backdrop-blur-xl"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#002D96]/10 text-[#002D96]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-[22px] font-black text-[#08123A]">{stat.value}</p>
                    <p className="mt-0.5 text-[12px] font-medium text-slate-500">{stat.label}</p>
                  </div>
                );
              })}
            </section>

            <section className="grid gap-5 md:grid-cols-2">
              {(about.sections || []).map((sec, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-[28px] border border-white/80 bg-white/85 p-6 shadow-xs backdrop-blur-xl"
                >
                  <div>
                    <h2 className="text-[20px] font-extrabold text-[#08123A]">{sec.heading}</h2>
                    <p className="mt-2.5 text-[13.5px] leading-relaxed font-medium text-slate-600">
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