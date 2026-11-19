import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Mail,
  MessageCircle,
  Phone,
  Send,
  User,
  X,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { useStudent } from '@/lib/StudentContext';
import { useToast } from '@/components/ui/use-toast';
import { copyText } from '@/lib/deal';
import { formatUzPhone } from '@/pages/Welcome';
import { cn } from '@/lib/utils';

const CONTACT_TYPES = [
  { id: 'suggestion', label: 'Taklif' },
  { id: 'complaint', label: 'Shikoyat' },
  { id: 'question', label: 'Aloqa / Savol' },
];

export default function Contact() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useStudent();

  const [type, setType] = useState('suggestion');
  const [fullName, setFullName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(formatUzPhone(profile?.phone || ''));
  const [message, setMessage] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // Huquqiy hujjatlar modali: 'terms' | 'privacy' | null
  const [legalModal, setLegalModal] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) return;

    if (fullName.trim().length < 2) {
      toast({ title: 'Ism va familiyangizni kiriting', variant: 'destructive' });
      return;
    }
    if (phone.replace(/\D/g, '').length !== 9) {
      toast({ title: 'Telefon raqamingizni to‘liq kiriting (9 ta raqam)', variant: 'destructive' });
      return;
    }
    if (message.trim().length < 5) {
      toast({ title: 'Xabar matnini batafsilroq yozing', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setSentSuccess(true);
      setMessage('');
      toast({
        title: 'Murojaatingiz qabul qilindi!',
        description: 'Tez orada mutaxassislarimiz siz bilan bog‘lanishadi.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
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

        <div className="grid gap-6 md:grid-cols-5">
          {/* 1-QISM: TEZKOR ALOQA KANALLARI */}
          <div className="space-y-4 md:col-span-2">
            <div className="rounded-[28px] border border-white/80 bg-white/85 p-6 shadow-xs backdrop-blur-xl">
              <h1 className="text-[22px] font-extrabold text-[#08123A]">Biz bilan bog‘lanish</h1>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">
                Savol, taklif yoki hamkorlik bo‘yicha quyidagi tezkor kanallarimiz orqali yoki
                murojaat formasi orqali yozishingiz mumkin.
              </p>

              <div className="mt-5 space-y-3">
                {/* Telegram Bot */}
                <a
                  href="https://t.me/imtiyosupport_bot"
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-[#1D6FF2] hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#00A9FF]/15 text-[#0077CC]">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Telegram bot
                      </p>
                      <p className="text-[13.5px] font-extrabold text-[#08123A] group-hover:text-[#1D6FF2]">
                        @imtiyosupport_bot
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-[#1D6FF2]" />
                </a>

                {/* Elektron pochta */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4">
                  <a href="mailto:support@imtiyo.uz" className="flex items-center gap-3 min-w-0">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#002D96]/10 text-[#002D96]">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Elektron pochta
                      </p>
                      <p className="truncate text-[13.5px] font-extrabold text-[#08123A] hover:text-[#1D6FF2]">
                        support@imtiyo.uz
                      </p>
                    </div>
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      await copyText('support@imtiyo.uz');
                      toast({ title: 'Email nusxalandi!', description: 'support@imtiyo.uz' });
                    }}
                    title="Nusxalash"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[#002D96] hover:bg-slate-200"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2-QISM: MUROJAAT YUBORISH FORMASI */}
          <div className="rounded-[28px] border border-white/80 bg-white/85 p-6 shadow-xs backdrop-blur-xl md:col-span-3">
            <h2 className="text-[18px] font-extrabold text-[#08123A]">Murojaat yuborish</h2>
            <p className="mt-1 text-[12px] text-slate-500">
              Formani to‘ldiring va biz siz bilan tez orada bog‘lanamiz
            </p>

            {sentSuccess ? (
              <div className="my-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                <h3 className="mt-2 text-[16px] font-extrabold text-[#08123A]">
                  Xabaringiz muvaffaqiyatli yuborildi!
                </h3>
                <p className="mt-1 text-[12.5px] text-slate-600">
                  Murojaatingiz uchun rahmat. Tez orada ko‘rsatilgan telefon raqamingiz orqali
                  javob beramiz.
                </p>
                <button
                  type="button"
                  onClick={() => setSentSuccess(false)}
                  className="mt-4 rounded-full bg-[#002D96] px-5 py-2 text-[12px] font-bold text-white"
                >
                  Yana xabar yuborish
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                {/* Murojaat turi Tablari */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold text-slate-500">
                    Murojaat turi
                  </label>
                  <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
                    {CONTACT_TYPES.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setType(item.id)}
                        className={cn(
                          'rounded-xl py-2 text-[12px] font-bold transition-all',
                          type === item.id
                            ? 'bg-white text-[#002D96] shadow-xs'
                            : 'text-slate-500 hover:text-[#08123A]'
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ism va familiya */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">
                    Ism va familiya
                  </label>
                  <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-[#1D6FF2]">
                    <User className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ism va familiyangizni kiriting"
                      className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none"
                    />
                  </div>
                </div>

                {/* Telefon raqami (+998 XX XXX XX XX) */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">
                    Telefon raqami
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-[#1D6FF2]">
                    <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="text-[13px] font-extrabold text-[#002D96]">+998</span>
                    <input
                      required
                      value={phone}
                      onChange={(e) => setPhone(formatUzPhone(e.target.value))}
                      inputMode="numeric"
                      placeholder="99 999 99 99"
                      className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none"
                    />
                  </div>
                </div>

                {/* Xabar matni */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">
                    Xabar matni
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Murojaatingiz mazmunini shu yerga yozing..."
                    className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-[13px] font-semibold text-[#08123A] outline-none focus:border-[#1D6FF2]"
                  />
                </div>

                {/* Rozilik Checkbox */}
                <label className="flex cursor-pointer items-start gap-2.5 pt-1 text-[12px] leading-relaxed text-slate-600">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#1D6FF2]"
                  />
                  <span>
                    Men{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setLegalModal('terms');
                      }}
                      className="font-bold text-[#1D6FF2] hover:underline"
                    >
                      Foydalanish shartlari
                    </button>{' '}
                    va{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setLegalModal('privacy');
                      }}
                      className="font-bold text-[#1D6FF2] hover:underline"
                    >
                      Maxfiylik siyosati
                    </button>{' '}
                    bilan tanishdim va rozilik bildiraman.
                  </span>
                </label>

                <Button
                  type="submit"
                  disabled={!agreed || sending}
                  className="h-11 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {sending ? 'Yuborilmoqda...' : 'Xabar yuborish'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* FOYDALANISH SHARTLARI VA MAXFIYLIK SIYOSATI MODALI */}
      {legalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#08123A]/50 p-4 backdrop-blur-xs"
          onClick={() => setLegalModal(null)}
        >
          <div
            className="max-h-[82vh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[18px] font-extrabold text-[#08123A]">
                {legalModal === 'terms' ? 'Foydalanish shartlari' : 'Maxfiylik siyosati'}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-[13px] leading-relaxed text-slate-600">
              {legalModal === 'terms' ? (
                <>
                  <p>
                    1. <strong>Umumiy qoidalar:</strong> Imtiyo.uz platformasi O‘zbekiston
                    Respublikasidagi oliy va o‘rta-maxsus ta’lim muassasalari talabalariga hamkor
                    brendlarning chegirma va bonuslaridan foydalanish imkonini beradi.
                  </p>
                  <p>
                    2. <strong>Murojaatlar:</strong> Yuborilgan taklif va shikoyatlar qo‘llab-quvvatlash
                    markazi tomonidan ko‘rib chiqiladi va foydalanuvchi ko‘rsatgan aloqa raqami orqali
                    javob beriladi.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    1. <strong>Shaxsiy ma’lumotlar himoyasi:</strong> Murojaat formasida kiritilgan
                    ism-familiya va telefon raqamingiz faqatgina sizning murojaatingizga javob
                    berish maqsadida ishlatiladi.
                  </p>
                  <p>
                    2. <strong>Maxfiylik:</strong> Ma’lumotlaringiz uchinchi shaxslarga berilmaydi va
                    himoyalangan serverlarda saqlanadi.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}