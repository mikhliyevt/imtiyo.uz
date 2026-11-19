import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Laptop,
  Lock,
  Monitor,
  Moon,
  Shield,
  Sun,
  X,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/LanguageContext';
import { useStudent } from '@/lib/StudentContext';
import { useTheme } from '@/lib/ThemeContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const PREFS_KEY = 'imtiyo_system_settings_v1';

export default function Settings() {
  const { t } = useLang();
  const { toast } = useToast();
  const { profile, isLoadingStudent } = useStudent();
  const { theme, setTheme } = useTheme();

  // 'security' | 'notifications' | 'appearance' | 'legal' | null (Hammasi boshida yopiq turadi)
  const [openPanel, setOpenPanel] = useState(null);

  const [prefs, setPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      return raw
        ? JSON.parse(raw)
        : {
            notifyDeals: true,
            notifyPromos: true,
            notifyStatus: true,
          };
    } catch {
      return { notifyDeals: true, notifyPromos: true, notifyStatus: true };
    }
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const [legalModal, setLegalModal] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ ...prefs, theme }));
    } catch {
      /* ignore */
    }
  }, [prefs, theme]);

  if (!isLoadingStudent && !profile?.signedIn) {
    return <Navigate to="/welcome?mode=signin&returnTo=%2Fsettings" replace />;
  }

  const togglePref = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    toast({ title: 'Sozlama saqlandi' });
  };

  const handleThemeSelect = (mode) => {
    setTheme(mode);
    const labels = {
      light: 'Yorug‘ (Light) rejim yoqildi',
      dark: 'Tungi (Dark) rejim yoqildi',
      system: 'Qurilma rejimi (System) tanlandi',
    };
    toast({ title: labels[mode] });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({
        title: 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Parollar bir-biriga mos kelmadi', variant: 'destructive' });
      return;
    }

    setSavingPass(true);
    try {
      await supabase.auth.updateUser({ password: newPassword });
      setNewPassword('');
      setConfirmPassword('');
      setOpenPanel(null);
      toast({ title: 'Parolingiz muvaffaqiyatli yangilandi!' });
    } catch {
      toast({ title: 'Parolni yangilashda xatolik', variant: 'destructive' });
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <div className="mb-5">
          <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-[#08123A]">
            {t('settings.title') || 'Tizim sozlamalari'}
          </h1>
          <p className="text-[12.5px] text-slate-500">
            Kerakli bo‘lim ustiga bosib sozlamalarni oching
          </p>
        </div>

        <div className="space-y-3">
          {/* 1. XAVFSIZLIK (BOSGANDA OCHILADI) */}
          <section className="overflow-hidden rounded-[24px] border border-white/85 bg-white/90 shadow-xs backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setOpenPanel(openPanel === 'security' ? null : 'security')}
              className="flex w-full items-center justify-between gap-3 p-4.5 text-left transition-colors hover:bg-slate-50/60"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#002D96]/10 text-[#002D96]">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[15px] font-extrabold text-[#08123A]">Xavfsizlik</h2>
                  <p className="text-[12px] text-slate-500">
                    Yangi parol qo‘yish va faol seans
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-slate-400 transition-transform duration-200',
                  openPanel === 'security' && 'rotate-180 text-[#002D96]'
                )}
              />
            </button>

            {openPanel === 'security' && (
              <form
                onSubmit={handlePasswordChange}
                className="space-y-3 border-t border-slate-100 px-5 pb-5 pt-4"
              >
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5">
                    <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Yangi parol (min. 6 belgi)"
                      className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="text-slate-400 hover:text-[#002D96]"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5">
                    <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Yangi parolni tasdiqlang"
                      className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-[11.5px] font-bold text-emerald-600">
                    <Laptop className="h-3.5 w-3.5" />
                    <span>Faol seans: Shu qurilma ({profile?.provider || 'Web'})</span>
                  </div>

                  <Button
                    type="submit"
                    disabled={savingPass || !newPassword}
                    className="h-9 rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] px-5 text-[12px] font-bold text-white"
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    {savingPass ? 'Saqlanmoqda...' : 'Parolni saqlash'}
                  </Button>
                </div>
              </form>
            )}
          </section>

          {/* 2. BILDIRISHNOMALAR (BOSGANDA OCHILADI) */}
          <section className="overflow-hidden rounded-[24px] border border-white/85 bg-white/90 shadow-xs backdrop-blur-xl">
            <button
              type="button"
              onClick={() =>
                setOpenPanel(openPanel === 'notifications' ? null : 'notifications')
              }
              className="flex w-full items-center justify-between gap-3 p-4.5 text-left transition-colors hover:bg-slate-50/60"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#1D6FF2]/10 text-[#1D6FF2]">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[15px] font-extrabold text-[#08123A]">Bildirishnomalar</h2>
                  <p className="text-[12px] text-slate-500">
                    Chegirmalar va promo-kodlar xabarnomalari
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-slate-400 transition-transform duration-200',
                  openPanel === 'notifications' && 'rotate-180 text-[#002D96]'
                )}
              />
            </button>

            {openPanel === 'notifications' && (
              <div className="space-y-2.5 border-t border-slate-100 px-5 pb-5 pt-4">
                {[
                  {
                    key: 'notifyDeals',
                    title: 'Yangi chegirmalar va aksiyalar',
                    desc: 'Yangi hamkor brendlar qo‘shilganda xabarnoma olish',
                  },
                  {
                    key: 'notifyPromos',
                    title: 'Maxsus promo-kodlar',
                    desc: 'Muddati cheklangan eksklyuziv promo-kodlar haqida eslatma',
                  },
                  {
                    key: 'notifyStatus',
                    title: 'Talabalik statusi o‘zgarishi',
                    desc: 'Hujjatingiz moderator tomonidan tasdiqlanganda xabar berish',
                  },
                ].map((item) => {
                  const active = Boolean(prefs[item.key]);
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-3"
                    >
                      <div>
                        <p className="text-[13px] font-bold text-[#08123A]">{item.title}</p>
                        <p className="text-[11.5px] text-slate-500">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={active}
                        onClick={() => togglePref(item.key)}
                        className={cn(
                          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                          active ? 'bg-[#1D6FF2]' : 'bg-slate-300 dark:bg-slate-700'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform',
                            active && 'translate-x-5'
                          )}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 3. KO'RINISH / TEMA (BOSGANDA OCHILADI) */}
          <section className="overflow-hidden rounded-[24px] border border-white/85 bg-white/90 shadow-xs backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setOpenPanel(openPanel === 'appearance' ? null : 'appearance')}
              className="flex w-full items-center justify-between gap-3 p-4.5 text-left transition-colors hover:bg-slate-50/60"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/10 text-amber-500">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5" />
                  ) : theme === 'system' ? (
                    <Monitor className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-[15px] font-extrabold text-[#08123A]">Ko‘rinish (Tema)</h2>
                  <p className="text-[12px] text-slate-500">
                    Yorug‘, Tungi yoki Qurilma rejimini tanlash
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-slate-400 transition-transform duration-200',
                  openPanel === 'appearance' && 'rotate-180 text-[#002D96]'
                )}
              />
            </button>

            {openPanel === 'appearance' && (
              <div className="grid grid-cols-1 gap-2.5 border-t border-slate-100 px-5 pb-5 pt-4 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handleThemeSelect('light')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-[12.5px] font-bold transition-all',
                    theme === 'light'
                      ? 'border-[#1D6FF2] bg-[#1D6FF2]/15 text-[#002D96] ring-2 ring-[#1D6FF2]/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span>Yorug‘ (Light)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeSelect('dark')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-[12.5px] font-bold transition-all',
                    theme === 'dark'
                      ? 'border-[#1D6FF2] bg-[#1D6FF2]/20 text-blue-400 ring-2 ring-[#1D6FF2]/30'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <Moon className="h-4 w-4 text-indigo-400" />
                  <span>Tungi (Dark)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeSelect('system')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-[12.5px] font-bold transition-all',
                    theme === 'system'
                      ? 'border-[#1D6FF2] bg-[#1D6FF2]/15 text-[#002D96] ring-2 ring-[#1D6FF2]/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <Monitor className="h-4 w-4 text-[#1D6FF2]" />
                  <span>Qurilma bilan bir xil</span>
                </button>
              </div>
            )}
          </section>

          {/* 4. HUQUQIY HUJJATLAR (BOSGANDA OCHILADI) */}
          <section className="overflow-hidden rounded-[24px] border border-white/85 bg-white/90 shadow-xs backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setOpenPanel(openPanel === 'legal' ? null : 'legal')}
              className="flex w-full items-center justify-between gap-3 p-4.5 text-left transition-colors hover:bg-slate-50/60"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-[#08123A]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[15px] font-extrabold text-[#08123A]">Huquqiy hujjatlar</h2>
                  <p className="text-[12px] text-slate-500">
                    Foydalanish shartlari va Maxfiylik siyosati
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-slate-400 transition-transform duration-200',
                  openPanel === 'legal' && 'rotate-180 text-[#002D96]'
                )}
              />
            </button>

            {openPanel === 'legal' && (
              <div className="grid grid-cols-1 gap-2.5 border-t border-slate-100 px-5 pb-5 pt-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setLegalModal('terms')}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left text-[13px] font-bold text-[#08123A] transition-colors hover:border-[#1D6FF2]"
                >
                  <span>Foydalanish shartlari</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setLegalModal('privacy')}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left text-[13px] font-bold text-[#08123A] transition-colors hover:border-[#1D6FF2]"
                >
                  <span>Maxfiylik siyosati</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

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
                    1. <strong>Umumiy qoidalar:</strong> IMTIYO platformasi O‘zbekiston
                    Respublikasidagi oliy va o‘rta-maxsus ta’lim muassasalari talabalariga hamkor
                    brendlarning chegirma va bonuslaridan foydalanish imkonini beradi.
                  </p>
                  <p>
                    2. <strong>Talabalikni tasdiqlash:</strong> Foydalanuvchi faqat o‘ziga tegishli
                    haqiqiy talabalik guvohnomasi yoki HEMIS ma’lumotnomasini yuklashi shart.
                  </p>
                  <p>
                    3. <strong>Promo-kod va QR-kodlar:</strong> Olingan promo-kodlar shaxsiy
                    hisoblanadi va ularni uchinchi shaxslarga sotish taqiqlanadi.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    1. <strong>Ma’lumotlarni yig‘ish:</strong> Biz faqat talabalik statusini
                    tasdiqlash va chegirmalarni taqdim etish uchun zarur bo‘lgan ma’lumotlarni
                    saqlaymiz.
                  </p>
                  <p>
                    2. <strong>Ma’lumotlar xavfsizligi:</strong> Shaxsiy ma’lumotlaringiz himoyalangan
                    bulutli serverlarda saqlanadi va uchinchi shaxslarga oshkor etilmaydi.
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