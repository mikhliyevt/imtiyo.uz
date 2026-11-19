import VerificationPill from '@/components/VerificationPill';
import { useLang } from '@/lib/LanguageContext';
import { useStudent } from '@/lib/StudentContext';
import { qrUrl } from '@/lib/deal';

export default function StudentCard() {
  const { t } = useLang();
  const { profile } = useStudent();

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/40 bg-gradient-to-br from-[#002D96] via-[#0B4FCC] to-[#00A9FF] p-5 text-white shadow-[0_26px_60px_-32px_rgba(0,45,150,0.95)]">
      <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
            {t('card.title')}
          </p>
          <p className="mt-1.5 truncate text-[17px] font-extrabold">{profile.name || t('settings.guest')}</p>
          <p className="truncate text-[11.5px] font-medium text-white/70">{profile.university}</p>
          <p className="mt-3 font-mono text-[13px] font-bold tracking-[0.08em] text-white">
            {profile.student_id || '—'}
          </p>
          <div className="mt-2.5">
            <VerificationPill status={profile.status} className="border-white/30 bg-white/15 text-white" />
          </div>
        </div>
        <div className="shrink-0 rounded-2xl bg-white p-1.5">
          <img
            src={qrUrl(`IMTIYO|${profile.student_id || 'guest'}|${profile.name || ''}`, 160)}
            alt="Student QR"
            className="h-[78px] w-[78px] rounded-lg"
          />
        </div>
      </div>
      <p className="relative mt-3 text-[10.5px] font-medium text-white/60">{t('card.note')}</p>
    </div>
  );
}