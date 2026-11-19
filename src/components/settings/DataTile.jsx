import { useState } from 'react';
import { UserRound } from 'lucide-react';
import SettingsTile from '@/components/settings/SettingsTile';
import VerifyModal from '@/components/VerifyModal';
import VerificationPill from '@/components/VerificationPill';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/LanguageContext';
import { useStudent } from '@/lib/StudentContext';
import { useToast } from '@/components/ui/use-toast';
import { universities } from '@/data/mockData';

export default function DataTile() {
  const { t } = useLang();
  const { profile, updateProfile } = useStudent();
  const { toast } = useToast();
  const [name, setName] = useState(profile.name || '');
  const [university, setUniversity] = useState(profile.university || universities[0]);
  const [verifyOpen, setVerifyOpen] = useState(false);

  return (
    <>
      <SettingsTile icon={UserRound} title={t('settings.myData')} hint={t('settings.myDataHint')}>
        <div className="space-y-3">
          <Field label={t('settings.fullName')}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none"
            />
          </Field>
          <Field label={t('settings.university')}>
            <select
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none"
            >
              {universities.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('settings.studentId')}>
            <span className="font-mono text-[13px] font-bold text-[#002D96]">
              {profile.student_id || '—'}
            </span>
          </Field>

          <div className="flex items-center justify-between rounded-2xl bg-slate-900/[0.04] px-3.5 py-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {t('settings.documentStatus')}
              </p>
              <p className="text-[11.5px] font-semibold text-[#08123A]">
                {profile.document_name || t('settings.notConnected')}
              </p>
            </div>
            <VerificationPill status={profile.status} />
          </div>

          <Button
            onClick={() => {
              updateProfile({ name, university });
              toast({ title: t('settings.saved') });
            }}
            className="h-11 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-bold text-white"
          >
            {t('common.save')}
          </Button>
          {profile.status !== 'verified' && (
            <button
              type="button"
              onClick={() => setVerifyOpen(true)}
              className="w-full text-center text-[11.5px] font-bold text-[#002D96] underline-offset-4 hover:underline"
            >
              {t('verify.cta')}
            </button>
          )}
        </div>
      </SettingsTile>
      <VerifyModal open={verifyOpen} onOpenChange={setVerifyOpen} />
    </>
  );
}

function Field({ label, children }) {
  return (
    <label className="block rounded-2xl border border-white/80 bg-white px-3.5 py-2.5">
      <span className="mb-0.5 block text-[9.5px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}