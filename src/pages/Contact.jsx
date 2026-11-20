import { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Mail,
  MessageCircle,
  Send,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/LanguageContext';
import { useStudent } from '@/lib/StudentContext';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/services/api';
import { copyText } from '@/lib/deal';
import { formatUzPhone } from '@/lib/formUtils';
import { cn } from '@/lib/utils';

export default function Contact() {
  const { t } = useLang();
  const { toast } = useToast();
  const { profile } = useStudent();

  const CONTACT_TYPES = [
    { id: 'suggestion', label: t('help.topicSuggestion') },
    { id: 'complaint', label: t('help.topicComplaint') },
    { id: 'question', label: t('help.topicHelp') },
  ];

  const [type, setType] = useState('suggestion');
  const [fullName, setFullName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(formatUzPhone(profile?.phone || ''));
  const [message, setMessage] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) return;

    if (fullName.trim().length < 2) {
      toast({ title: t('contact.errName'), variant: 'destructive' });
      return;
    }
    if (phone.replace(/\D/g, '').length !== 9) {
      toast({ title: t('contact.errPhone'), variant: 'destructive' });
      return;
    }
    if (message.trim().length < 5) {
      toast({ title: t('contact.errMessage'), variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      await api.createSupportMessage({
        student_id: profile?.student_id || '',
        full_name: fullName.trim(),
        contact: `+998 ${phone}`,
        email: profile?.email || '',
        category: type,
        message: message.trim(),
      });
      setSentSuccess(true);
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
    <AppShell breadcrumbs={[{ label: t('nav.contact') }]}>
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
        <div className="grid gap-6 md:grid-cols-5">
          {/* 1-QISM: TEZKOR ALOQA KANALLARI */}
          <div className="space-y-4 md:col-span-2">
            <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
              <h1 className="text-[22px] font-extrabold text-[#08123A] dark:text-white">
                {t('contact.title')}
              </h1>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                {t('contact.subtitle')}
              </p>

              <div className="mt-5 space-y-3">
                <a
                  href="https://t.me/imtiyosupport_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:border-[#1D6FF2] hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/70 dark:hover:border-sky-400"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#00A9FF]/15 text-[#0077CC] dark:text-sky-400">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {t('help.telegramSupport')}
                      </p>
                      <p className="text-[13.5px] font-extrabold text-[#08123A] group-hover:text-[#1D6FF2] dark:text-white dark:group-hover:text-sky-400">
                        @imtiyosupport_bot
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-[#1D6FF2]" />
                </a>

                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/70">
                  <a href="mailto:support@imtiyo.uz" className="flex min-w-0 items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#002D96]/10 text-[#002D96] dark:bg-sky-500/15 dark:text-sky-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {t('help.emailLabel')}
                      </p>
                      <p className="truncate text-[13.5px] font-extrabold text-[#08123A] hover:text-[#1D6FF2] dark:text-white">
                        support@imtiyo.uz
                      </p>
                    </div>
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      await copyText('support@imtiyo.uz');
                      toast({ title: t('contact.emailCopied'), description: 'support@imtiyo.uz' });
                    }}
                    title={t('common.copy')}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[#002D96] shadow-sm hover:bg-slate-100 dark:bg-slate-700 dark:text-sky-300"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2-QISM: MUROJAAT YUBORISH FORMASI */}
          <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 md:col-span-3">
            <h2 className="text-[18px] font-extrabold text-[#08123A] dark:text-white">
              {t('contact.formTitle')}
            </h2>
            <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
              {t('contact.formSubtitle')}
            </p>

            {sentSuccess ? (
              <div className="my-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center dark:border-emerald-500/30 dark:bg-emerald-950/40">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                <h3 className="mt-2 text-[16px] font-extrabold text-[#08123A] dark:text-white">
                  {t('contact.successTitle')}
                </h3>
                <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-300">
                  {t('contact.successDesc')}
                </p>
                <button
                  type="button"
                  onClick={() => setSentSuccess(false)}
                  className="mt-4 rounded-full bg-[#002D96] px-5 py-2 text-[12px] font-bold text-white"
                >
                  {t('contact.sendAnother')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {t('help.topicLabel')}
                  </label>
                  <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                    {CONTACT_TYPES.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setType(item.id)}
                        className={cn(
                          'rounded-xl py-2 text-[12px] font-bold transition-all',
                          type === item.id
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
                  <label className="mb-1.5 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {t('profile.fullName')}
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
                  <label className="mb-1.5 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {t('profile.phone')} (+998)
                  </label>
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatUzPhone(e.target.value))}
                    inputMode="numeric"
                    placeholder="99 999 99 99"
                    className="imtiyo-help-input"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
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

                <label className="flex cursor-pointer items-start gap-2.5 pt-1 text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#1D6FF2]"
                  />
                  <span>
                    {t('contact.agreePrefix')}{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-[#1D6FF2] hover:underline dark:text-sky-400"
                    >
                      {t('nav.terms')}
                    </a>{' '}
                    {t('welcome.termsAnd')}{' '}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-[#1D6FF2] hover:underline dark:text-sky-400"
                    >
                      {t('nav.privacy')}
                    </a>{' '}
                    {t('contact.agreeSuffix')}
                  </span>
                </label>

                <Button
                  type="submit"
                  disabled={!agreed || sending}
                  className="h-11 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {sending ? t('help.sending') : t('help.send')}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
