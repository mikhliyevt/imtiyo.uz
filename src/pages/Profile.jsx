import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Camera,
  Check,
  Copy,
  Edit3,
  GraduationCap,
  LogIn,
  LogOut,
  QrCode,
  Settings as SettingsIcon,
  ShieldCheck,
  Smartphone,
  Ticket,
  UserPlus,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import StudentCard from '@/components/StudentCard';
import VerificationPill from '@/components/VerificationPill';
import VerifyModal from '@/components/VerifyModal';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/LanguageContext';
import { useStudent } from '@/lib/StudentContext';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/services/api';
import { copyText } from '@/lib/deal';
import { REGIONS, formatUzPhone, formatBirthDateMask } from '@/pages/Welcome';

export default function Profile() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { profile, signOut, updateProfile, reload } = useStudent();
  const { toast } = useToast();
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [codes, setCodes] = useState([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [universities, setUniversities] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editGender, setEditGender] = useState(profile?.gender || '');
  const [editBirthDate, setEditBirthDate] = useState(profile?.birth_date || '');
  const [editPhone, setEditPhone] = useState('');
  const [editRegion, setEditRegion] = useState(profile?.region || '');
  const [editUniversity, setEditUniversity] = useState(profile?.university || '');
  const [editCustomInstitution, setEditCustomInstitution] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    reload?.();
    api.listUniversities().then((list) => setUniversities(list || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (profile) {
      setEditName(profile.name || '');
      setEditGender(profile.gender || '');
      setEditBirthDate(formatBirthDateMask(profile.birth_date || ''));
      setEditPhone(formatUzPhone(profile.phone || ''));
      setEditRegion(profile.region || '');

      const uniNames = universities.map((u) => (typeof u === 'string' ? u : u.name));
      const currentUni = profile.university || '';

      if (currentUni.startsWith('Boshqa - ')) {
        setEditUniversity('Boshqa');
        setEditCustomInstitution(currentUni.replace('Boshqa - ', ''));
      } else if (currentUni && uniNames.length > 0 && !uniNames.includes(currentUni)) {
        setEditUniversity('Boshqa');
        setEditCustomInstitution(currentUni);
      } else {
        setEditUniversity(currentUni);
        setEditCustomInstitution('');
      }
    }
  }, [profile, universities]);

  useEffect(() => {
    if (profile?.signedIn && profile?.name) {
      api.listRedemptions(profile.name).then(setCodes);
    } else {
      setCodes([]);
    }
  }, [profile?.signedIn, profile?.name]);

  const filteredUniversities = useMemo(() => {
    const normalizeRegion = (r) =>
      String(r || '')
        .toLowerCase()
        .replace(/viloyati|shahri|respublikasi/g, '')
        .trim();
    const selectedNorm = normalizeRegion(editRegion);

    return [...universities]
      .filter((u) => {
        if (typeof u === 'string') return true;
        if (!editRegion || !u.region) return true;
        return u.region === editRegion || normalizeRegion(u.region) === selectedNorm;
      })
      .sort((a, b) => {
        const nameA = typeof a === 'string' ? a : a.name || '';
        const nameB = typeof b === 'string' ? b : b.name || '';
        return nameA.localeCompare(nameB, 'uz');
      });
  }, [universities, editRegion]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    setUploadingAvatar(true);
    try {
      const url = await api.uploadFile(file, 'avatars');
      await updateProfile({ avatar_url: url });
      toast({ title: 'Profil rasmi yangilandi' });
    } catch {
      const localUrl = URL.createObjectURL(file);
      await updateProfile({ avatar_url: localUrl });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile?.id) return;

    if (editUniversity === 'Boshqa' && editCustomInstitution.trim().length < 2) {
      toast({ title: "Ta'lim muassasangiz nomini kiriting", variant: 'destructive' });
      return;
    }

    const phoneDigits = editPhone.replace(/\D/g, '');
    if (phoneDigits.length > 0 && phoneDigits.length !== 9) {
      toast({ title: 'Telefon raqamni 9 ta raqam bilan to‘liq kiriting', variant: 'destructive' });
      return;
    }

    if (editBirthDate && editBirthDate.length !== 10) {
      toast({
        title: 'Tug‘ilgan sanani KK.OO.YYYY formatida to‘liq kiriting',
        variant: 'destructive',
      });
      return;
    }

    setSavingProfile(true);
    try {
      const finalUni =
        editUniversity === 'Boshqa' ? editCustomInstitution.trim() : editUniversity;
      const formattedPhone = phoneDigits ? `+998 ${formatUzPhone(phoneDigits)}` : '';

      const updatedData = {
        full_name: editName.trim(),
        name: editName.trim(),
        gender: editGender,
        birth_date: editBirthDate.trim(),
        phone: formattedPhone,
        region: editRegion,
        university: finalUni,
      };
      await updateProfile(updatedData);
      setIsEditing(false);
      toast({ title: 'Profil ma’lumotlari saqlandi' });
    } catch {
      toast({ title: 'Saqlashda xatolik yuz berdi', variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await signOut();
    navigate('/welcome?mode=signin', { replace: true });
  };

  if (!profile?.signedIn) {
    return (
      <AppShell>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-[#08123A]">
            {t('profile.title')}
          </h1>
        </div>

        <div className="mx-auto mt-6 max-w-md rounded-[28px] border border-white/80 bg-white/80 p-6 text-center shadow-[0_24px_60px_-34px_rgba(0,45,150,0.65)] backdrop-blur-2xl">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#002D96] to-[#00A9FF] text-white">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h2 className="text-[20px] font-extrabold text-[#08123A]">Shaxsiy kabinet</h2>
          <p className="mx-auto mt-1.5 max-w-[290px] text-[12.5px] leading-relaxed text-slate-500">
            Ro‘yxatdan o‘ting va talabalik guvohnomangizni tasdiqlab, barcha hamkorlar
            chegirmalaridan foydalaning.
          </p>

          <div className="mt-5 space-y-2.5">
            <Link
              to="/welcome?mode=signup"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-bold text-white shadow-[0_14px_30px_-14px_rgba(0,45,150,0.9)]"
            >
              <UserPlus className="h-4 w-4" />
              Ro‘yxatdan o‘tish
            </Link>
            <Link
              to="/welcome?mode=signin"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-[13px] font-bold text-[#08123A]"
            >
              <LogIn className="h-4 w-4" />
              Tizimga kirish
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const note =
    profile.status === 'verified'
      ? 'verify.verifiedNote'
      : profile.status === 'pending'
        ? 'verify.pendingNote'
        : 'verify.unverifiedNote';

  const initials = (profile.name || 'F')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-[#08123A]">
          {t('profile.title')}
        </h1>
        <Link
          to="/settings"
          aria-label={t('settings.title')}
          className="grid h-9 w-9 place-items-center rounded-full border border-white/70 bg-white/70 text-[#002D96] backdrop-blur-xl"
        >
          <SettingsIcon className="h-4 w-4" />
        </Link>
      </div>

      <StudentCard />

      <div className="mt-4 rounded-[26px] border border-white/70 bg-white/75 p-5 shadow-[0_24px_60px_-34px_rgba(0,45,150,0.7)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <label className="group relative grid h-14 w-14 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#002D96] to-[#00A9FF] text-[17px] font-extrabold text-white">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-4 w-4 text-white" />
              </span>
              <input
                type="file"
                accept="image/*"
                disabled={uploadingAvatar}
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
            <div className="min-w-0">
              <p className="truncate text-[16px] font-extrabold text-[#08123A]">{profile.name}</p>
              <p className="truncate text-[12px] text-slate-500">
                {profile.university || 'Ta’lim muassasasi kiritilmagan'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-bold text-[#002D96] shadow-sm"
          >
            <Edit3 className="h-3.5 w-3.5" />
            {isEditing ? 'Yopish' : 'Tahrirlash'}
          </button>
        </div>

        {isEditing && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-4 space-y-3 border-t border-slate-100 pt-4"
          >
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">F.I.O</label>
              <input
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold outline-none focus:border-[#1D6FF2]"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">Jinsi</label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold outline-none focus:border-[#1D6FF2]"
                >
                  <option value="">Tanlanmagan</option>
                  <option value="male">O‘g‘il bola</option>
                  <option value="female">Qiz bola</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  Tug‘ilgan sana (DD.MM.YYYY)
                </label>
                <input
                  value={editBirthDate}
                  onChange={(e) => setEditBirthDate(formatBirthDateMask(e.target.value))}
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="01.09.2004"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold outline-none focus:border-[#1D6FF2]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  Telefon raqam
                </label>
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-[#1D6FF2]">
                  <span className="text-[12.5px] font-extrabold text-[#002D96]">+998</span>
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(formatUzPhone(e.target.value))}
                    inputMode="numeric"
                    placeholder="99 999 99 99"
                    className="w-full bg-transparent text-[12.5px] font-semibold text-[#08123A] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">Viloyat</label>
                <select
                  value={editRegion}
                  onChange={(e) => {
                    setEditRegion(e.target.value);
                    setEditUniversity('');
                    setEditCustomInstitution('');
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold outline-none focus:border-[#1D6FF2]"
                >
                  <option value="">Viloyatni tanlang</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                Oliy ta’lim muassasasi
              </label>
              <select
                value={editUniversity}
                onChange={(e) => {
                  setEditUniversity(e.target.value);
                  if (e.target.value !== 'Boshqa') setEditCustomInstitution('');
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold outline-none focus:border-[#1D6FF2]"
              >
                <option value="">Tanlang...</option>
                {filteredUniversities.map((u) => {
                  const name = typeof u === 'string' ? u : u.name;
                  const shortName = typeof u === 'object' && u.short_name ? u.short_name : '';
                  return (
                    <option key={u.id || name} value={name}>
                      {shortName ? `${shortName} — ${name}` : name}
                    </option>
                  );
                })}
                <option value="Boshqa">Boshqa</option>
              </select>
            </div>

            {editUniversity === 'Boshqa' && (
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#002D96]">
                  Ta'lim muassasangiz
                </label>
                <input
                  required
                  value={editCustomInstitution}
                  onChange={(e) => setEditCustomInstitution(e.target.value)}
                  placeholder="Ta'lim muassasangiz"
                  className="w-full rounded-xl border border-[#1D6FF2]/50 bg-[#1D6FF2]/[0.03] px-3 py-2 text-[12.5px] font-semibold outline-none focus:border-[#1D6FF2]"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={savingProfile}
              className="h-10 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[12px] font-bold text-white"
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              {savingProfile ? 'Saqlanmoqda...' : 'O‘zgarishlarni saqlash'}
            </Button>
          </form>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <VerificationPill status={profile.status} />
          {(profile.email || profile.phone) && (
            <span className="rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-500">
              {profile.email || profile.phone}
            </span>
          )}
          {profile.birth_date && (
            <span className="rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-500">
              {profile.birth_date}
            </span>
          )}
          {profile.gender && (
            <span className="rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-500">
              {profile.gender === 'male' ? 'O‘g‘il bola' : 'Qiz bola'}
            </span>
          )}
          {profile.region && (
            <span className="rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-500">
              {profile.region}
            </span>
          )}
        </div>

        {/* RAD ETILGAN BO'LSA: ADMIN YOZGAN SABAB VA KIM RAD ETGANINI KO'RSATISH */}
        {profile.status === 'rejected' && (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3.5 text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300">
            <div className="flex items-center gap-2 text-[13px] font-extrabold">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>Hujjatingiz rad etildi</span>
            </div>
            <p className="mt-1 text-[12.5px] font-semibold">
              Sabab: <span className="font-bold">{profile.rejection_reason || 'Hujjat talabga javob bermaydi. Iltimos, sifatliroq nusxasini qayta yuklang.'}</span>
            </p>
            {profile.reviewed_by && (
              <p className="mt-1 text-[11px] font-medium opacity-80">
                Tekshirdi: <strong>{profile.reviewed_by}</strong>
              </p>
            )}
          </div>
        )}

        {/* TASDIQLANGAN BO'LSA: QAYSI ADMIN TASDIQLAGANINI KO'RSATISH */}
        {profile.status === 'verified' && profile.reviewed_by && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-2.5 text-[12px] font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Tasdiqladi: {profile.reviewed_by}</span>
          </div>
        )}

        <p className="mt-3 rounded-2xl bg-[#002D96]/[0.05] px-4 py-3 text-[12px] font-medium leading-relaxed text-[#002D96]">
          {t(note)}
        </p>

        {profile.status !== 'verified' && (
          <Button
            onClick={() => setVerifyOpen(true)}
            className="mt-3 h-11 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-bold text-white"
          >
            {profile.status === 'rejected'
              ? 'Hujjatni qaytadan yuklash'
              : t('verify.cta')}
          </Button>
        )}
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-[13px] font-extrabold uppercase tracking-wide text-[#08123A]">
          {t('profile.codes')}
        </h2>
        {codes.length ? (
          <ul className="space-y-2">
            {codes.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-[20px] border border-white/70 bg-white/65 px-3.5 py-3 backdrop-blur-xl"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#002D96]/10 text-[#002D96]">
                  {c.redemption_type === 'app' ? (
                    <Smartphone className="h-4 w-4" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold text-[#08123A]">{c.brand_name}</p>
                  <p className="truncate font-mono text-[11px] text-slate-500">{c.code}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await copyText(c.code);
                    toast({ title: t('toast.copied'), description: c.code });
                  }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[#002D96] shadow-sm"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-[22px] border border-dashed border-white/80 bg-white/50 px-4 py-6 text-center">
            <Ticket className="mx-auto h-5 w-5 text-slate-400" />
            <p className="mt-2 text-[12.5px] font-semibold text-[#08123A]">
              {t('profile.noCodes')}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">{t('profile.empty')}</p>
          </div>
        )}
      </section>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50/80 text-[12.5px] font-bold text-rose-600 transition-colors hover:bg-rose-100"
        >
          <LogOut className="h-4 w-4" />
          Chiqish
        </button>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08123A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[26px] border border-white/80 bg-white p-5 shadow-2xl">
            <h3 className="text-[16px] font-extrabold text-[#08123A]">Tizimdan chiqish</h3>
            <p className="mt-1.5 text-[13px] text-slate-600">
              Haqiqatan ham tizimdan chiqmoqchimisiz?
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-full border border-slate-200 bg-white py-2.5 text-[12.5px] font-bold text-slate-600 hover:bg-slate-50"
              >
                Yo‘q
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 rounded-full bg-rose-500 py-2.5 text-[12.5px] font-bold text-white hover:bg-rose-600"
              >
                Ha, chiqish
              </button>
            </div>
          </div>
        </div>
      )}

      <VerifyModal open={verifyOpen} onOpenChange={setVerifyOpen} />
    </AppShell>
  );
}