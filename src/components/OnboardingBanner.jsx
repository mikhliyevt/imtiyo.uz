import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import VerifyModal from '@/components/VerifyModal';
import { useLang } from '@/lib/LanguageContext';
import { useStudent } from '@/lib/StudentContext';

export default function OnboardingBanner() {
  const { t } = useLang();
  const { profile } = useStudent();
  const [open, setOpen] = useState(false);

  if (profile.status === 'verified') return null;

  return (
    <>
      <section className="mb-5 overflow-hidden rounded-[24px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_44px_-30px_rgba(0,45,150,0.7)] backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#002D96] to-[#00A9FF] text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold leading-tight text-[#08123A]">
              {t('onboard.title')}
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">{t('onboard.body')}</p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-2.5 rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] px-4 py-2 text-[11.5px] font-bold text-white"
            >
              {profile.status === 'pending' ? t('status.pending') : t('onboard.cta')}
            </button>
          </div>
        </div>
      </section>
      <VerifyModal open={open} onOpenChange={setOpen} />
    </>
  );
}