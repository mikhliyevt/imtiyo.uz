import { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Laptop,
  Lock,
  Monitor,
  Moon,
  Shield,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudent } from '@/lib/StudentContext';
import { useTheme } from '@/lib/ThemeContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const PREFS_KEY = 'imtiyo_system_settings_v1';

export default function SettingsPanel() {
  const { toast } = useToast();
  const { profile } = useStudent();
  const { theme, setTheme } = useTheme();

  const [openPanel, setOpenPanel] = useState('appearance');

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

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ ...prefs, theme }));
    } catch {
      /* ignore */
    }
  }, [prefs, theme]);

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
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
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
    <div className="space-y-3.5">
      {/* 1. KO'RINISH / TEMA */}
      <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
        <button
          type="button"
          onClick={() => setOpenPanel(openPanel === 'appearance' ? null : 'appearance')}
          className="flex w-full items-center justify-between gap-3 p-5 text-left transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/60"
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
              <h2 className="text-[15px] font-extrabold text-[#08123A] dark:text-white">
                Ko‘rinish (Tema)
              </h2>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Yorug‘, Tungi yoki Qurilma rejimini tanlash
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-slate-400 transition-transform duration-200',
              openPanel === 'appearance' && 'rotate-180 text-[#002D96] dark:text-sky-400'
            )}
          />
        </button>

        {openPanel === 'appearance' && (
          <div className="grid grid-cols-1 gap-2.5 border-t border-slate-100 px-5 pb-5 pt-4 dark:border-slate-800 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => handleThemeSelect('light')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-[12.5px] font-bold transition-all',
                theme === 'light'
                  ? 'border-[#1D6FF2] bg-[#1D6FF2]/15 text-[#002D96] ring-2 ring-[#1D6FF2]/20 dark:text-sky-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
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
                  ? 'border-[#1D6FF2] bg-[#1D6FF2]/20 text-sky-300 ring-2 ring-[#1D6FF2]/30'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
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
                  ? 'border-[#1D6FF2] bg-[#1D6FF2]/15 text-[#002D96] ring-2 ring-[#1D6FF2]/20 dark:text-sky-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              )}
            >
              <Monitor className="h-4 w-4 text-[#1D6FF2] dark:text-sky-400" />
              <span>Qurilma bilan bir xil</span>
            </button>
          </div>
        )}
      </section>

      {/* 2. XAVFSIZLIK */}
      <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
        <button
          type="button"
          onClick={() => setOpenPanel(openPanel === 'security' ? null : 'security')}
          className="flex w-full items-center justify-between gap-3 p-5 text-left transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/60"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#002D96]/10 text-[#002D96] dark:bg-sky-500/15 dark:text-sky-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-extrabold text-[#08123A] dark:text-white">
                Xavfsizlik
              </h2>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Yangi parol qo‘yish va faol seans
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-slate-400 transition-transform duration-200',
              openPanel === 'security' && 'rotate-180 text-[#002D96] dark:text-sky-400'
            )}
          />
        </button>

        {openPanel === 'security' && (
          <form
            onSubmit={handlePasswordChange}
            className="space-y-3 border-t border-slate-100 px-5 pb-5 pt-4 dark:border-slate-800"
          >
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Yangi parol (min. 6 belgi)"
                  className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="text-slate-400 hover:text-[#002D96] dark:hover:text-sky-300"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Yangi parolni tasdiqlang"
                  className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-[11.5px] font-bold text-emerald-700 dark:text-emerald-300">
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

      {/* 3. BILDIRISHNOMALAR */}
      <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
        <button
          type="button"
          onClick={() =>
            setOpenPanel(openPanel === 'notifications' ? null : 'notifications')
          }
          className="flex w-full items-center justify-between gap-3 p-5 text-left transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/60"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#1D6FF2]/10 text-[#1D6FF2] dark:bg-sky-500/15 dark:text-sky-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-extrabold text-[#08123A] dark:text-white">
                Bildirishnomalar
              </h2>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Chegirmalar va talabalik statusi xabarnomalari
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-slate-400 transition-transform duration-200',
              openPanel === 'notifications' && 'rotate-180 text-[#002D96] dark:text-sky-400'
            )}
          />
        </button>

        {openPanel === 'notifications' && (
          <div className="space-y-2.5 border-t border-slate-100 px-5 pb-5 pt-4 dark:border-slate-800">
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
                desc: 'Hujjatingiz moderator tomonidan tasdiqlanganda yoki rad etilganda xabar berish',
              },
            ].map((item) => {
              const active = Boolean(prefs[item.key]);
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/70"
                >
                  <div>
                    <p className="text-[13px] font-bold text-[#08123A] dark:text-white">
                      {item.title}
                    </p>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                      {item.desc}
                    </p>
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
                        'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
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
    </div>
  );
}
