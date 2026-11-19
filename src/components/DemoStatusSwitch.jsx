import { Switch } from '@/components/ui/switch';
import { useStudent } from '@/lib/StudentContext';
import { useLang } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';

export default function DemoStatusSwitch({ compact = false }) {
  const { profile, setStatus } = useStudent();
  const { t } = useLang();
  const verified = profile.status === 'verified';

  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-1.5 rounded-full border border-white/70 bg-white/60 px-2 py-1 backdrop-blur-xl',
        compact && 'pl-2.5'
      )}
      title={t('verify.demoHint')}
    >
      {!compact && <span className="text-[11px] font-semibold text-slate-500">{t('verify.demo')}</span>}
      <Switch
        checked={verified}
        onCheckedChange={(v) => setStatus(v ? 'verified' : 'unverified')}
        className="h-[18px] w-8 data-[state=checked]:bg-emerald-500"
      />
    </label>
  );
}