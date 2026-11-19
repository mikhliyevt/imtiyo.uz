import { useState } from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { DEFAULT_FAQ_ITEMS } from '@/services/api';
import { cn } from '@/lib/utils';

export default function Help() {
  const { toast } = useToast();
  const [openIndex, setOpenIndex] = useState(0);

  // Bog'lanish formasi
  const [fullName, setFullName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim() || !message.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setFullName('');
      setContactInfo('');
      setMessage('');
      toast({
        title: 'Xabaringiz yuborildi!',
        description: 'Tez orada mutaxassislarimiz siz bilan bog‘lanishadi.',
      });
    }, 500);
  };

  return (
    <AppShell breadcrumbs={[{ label: 'Yordam va Bog‘lanish' }]}>
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
        {/* 1-QISM: KO'P BERILADIGAN SAVOLLAR (FAQ) */}
        <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_50px_-30px_rgba(0,45,150,0.28)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#002D96]/10 text-[#002D96] dark:bg-sky-500/15 dark:text-sky-400">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-[22px] font-extrabold text-[#08123A] dark:text-white">
                Yordam va Bog‘lanish markazi
              </h1>
              <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
                Ko‘p beriladigan savollar hamda tezkor qayta aloqa
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {DEFAULT_FAQ_ITEMS.map((item, idx) => {
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
                        <p className="font-bold text-[#08123A] dark:text-slate-100">{item.intro}</p>
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

        {/* 2-QISM: BIZ BILAN BOG'LANISH (UIVERSE #3 Jaareet ANIMATED INPUTS) */}
        <div className="grid gap-5 md:grid-cols-5">
          <div className="space-y-3 rounded-[28px] bg-gradient-to-br from-[#002D96] via-[#1D6FF2] to-[#00A9FF] p-6 text-white shadow-md md:col-span-2">
            <h2 className="text-[19px] font-extrabold">Biz bilan bog‘lanish</h2>
            <p className="text-[12.5px] leading-relaxed text-white/85">
              Savol, taklif yoki hamkorlik bo‘yicha murojaatingizni qoldiring — jamoamiz sizga
              tezkor javob beradi.
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
                  <p className="text-[11px] text-white/75">Telegram qo‘llab-quvvatlash</p>
                  <p>@imtiyosupport_bot</p>
                </div>
              </a>

              <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 font-bold backdrop-blur-md">
                <Phone className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-[11px] text-white/75">Ishonch telefoni</p>
                  <p>+998 (71) 200-00-00</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 font-bold backdrop-blur-md">
                <Mail className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-[11px] text-white/75">Elektron pochta</p>
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
                Xabar yuborish
              </h3>
            </div>

            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                Ism va familiyangiz *
              </label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ismingizni kiriting"
                className="imtiyo-help-input"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                Telefon raqam yoki Telegram (@username) *
              </label>
              <input
                required
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="+998 90 123 45 67 yoki @username"
                className="imtiyo-help-input"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                Murojaat matni *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Savolingiz yoki taklifingizni batafsil yozing..."
                className="imtiyo-help-input resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={sending}
              className="h-11 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-extrabold text-white shadow-md"
            >
              <Send className="mr-2 h-4 w-4" />
              {sending ? 'Yuborilmoqda...' : 'Xabarni yuborish'}
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
