import { BadgeCheck, Clock3, ShieldAlert, XCircle } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';

const styles = {
  verified: {
    icon: BadgeCheck,
    label: 'status.verified',
    fallback: 'Tasdiqlangan talaba',
    className:
      'bg-emerald-500/12 text-emerald-700 border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/35',
  },
  pending: {
    icon: Clock3,
    label: 'status.pending',
    fallback: 'Tekshirilmoqda',
    className:
      'bg-amber-400/15 text-amber-700 border-amber-400/35 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/35',
  },
  rejected: {
    icon: XCircle,
    label: 'admin.rejected',
    fallback: 'Rad etilgan',
    className:
      'bg-rose-500/12 text-rose-700 border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/35',
  },
  unverified: {
    icon: ShieldAlert,
    label: 'status.unverified',
    fallback: 'Tasdiqlanmagan',
    className:
      'bg-slate-500/10 text-slate-600 border-slate-400/30 dark:bg-slate-700/60 dark:text-slate-300 dark:border-slate-600',
  },
};

export default function VerificationPill({ status = 'unverified', className }) {
  const { t } = useLang();
  const conf = styles[status] || styles.unverified;
  const Icon = conf.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-bold backdrop-blur-md',
        conf.className,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{t(conf.label) || conf.fallback}</span>
    </span>
  );
}
