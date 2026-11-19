import { BadgeCheck, Clock3, ShieldAlert } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';

const styles = {
  verified: {
    icon: BadgeCheck,
    label: 'status.verified',
    className: 'bg-emerald-500/12 text-emerald-700 border-emerald-500/30',
  },
  pending: {
    icon: Clock3,
    label: 'status.pending',
    className: 'bg-amber-400/15 text-amber-700 border-amber-400/35',
  },
  unverified: {
    icon: ShieldAlert,
    label: 'status.unverified',
    className: 'bg-slate-500/10 text-slate-600 border-slate-400/30',
  },
};

export default function VerificationPill({ status = 'unverified', className }) {
  const { t } = useLang();
  const conf = styles[status] || styles.unverified;
  const Icon = conf.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold backdrop-blur-md',
        conf.className,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {t(conf.label)}
    </span>
  );
}