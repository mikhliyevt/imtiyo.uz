import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  Building2,
  Camera,
  Check,
  Copy,
  Edit3,
  ExternalLink,
  FileText,
  GraduationCap,
  Heart,
  HelpCircle,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Settings as SettingsIcon,
  ShieldCheck,
  Smartphone,
  Ticket,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import StudentCard from '@/components/StudentCard';
import VerificationPill from '@/components/VerificationPill';
import VerifyModal from '@/components/VerifyModal';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/LanguageContext';
import { useStudent } from '@/lib/StudentContext';
import { useToast } from '@/components/ui/use-toast';
import { api, COURSE_OPTIONS, normalizeCourse } from '@/services/api';
import { copyText } from '@/lib/deal';
import { REGIONS, formatUzPhone, formatBirthDateMask } from '@/lib/formUtils';
import { cn } from '@/lib/utils';

const PROFILE_TABS = [
  { id: 'overview', label: 'Mening profilim', icon: User },
  { id: 'status', label: 'Talabalik statusi', icon: ShieldCheck },
  { id: 'data', label: 'Mening ma’lumotlarim', icon: GraduationCap },
  { id: 'codes', label: 'Promo kodlarim', icon: Ticket },
];

export default function Profile() {
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut, updateProfile, reload } = useStudent();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(() =>
    location.hash === '#codes' ? 'codes' : 'overview'
  );
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [codes, setCodes] = useState([]);
  const [likedCount, setLikedCount] = useState(() => api.getLikedIds().length);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [universities, setUniversities] = useState([]);
  // Separate card edit states: 'personal' | 'education' | 'contact' | null
  const [editingCard, setEditingCard] = useState(null);

  const [editName, setEditName] = useState(profile?.name || '');
  const [editGender, setEditGender] = useState(profile?.gender || '');
  const [editBirthDate, setEditBirthDate] = useState(profile?.birth_date || '');
  const [editPhone, setEditPhone] = useState('');
  const [editRegion, setEditRegion] = useState(profile?.region || '');
  const [editUniversity, setEditUniversity] = useState(profile?.university || '');
  const [editCustomInstitution, setEditCustomInstitution] = useState('');
  const [editCourse, setEditCourse] = useState(normalizeCourse(profile?.course));
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (location.hash === '#codes') {
      setActiveTab('codes');
    }
  }, [location.hash]);

  useEffect(() => {
    api.listUniversities().then((list) => setUniversities(list || [])).catch(() => {});
    const syncLikes = () => setLikedCount(api.getLikedIds().length);
    window.addEventListener('imtiyo_likes_changed', syncLikes);
    return () => window.removeEventListener('imtiyo_likes_changed', syncLikes);
  }, []);

  useEffect(() => {
    if (profile?.signedIn) {
      reload?.();
    }
  }, [profile?.signedIn]);

  useEffect(() => {
    if (!profile) return;
    setEditName(profile.name || '');
    setEditGender(profile.gender || '');
    setEditBirthDate(formatBirthDateMask(profile.birth_date || ''));
    setEditPhone(formatUzPhone(profile.phone || ''));
    setEditRegion(profile.region || '');
    setEditCourse(normalizeCourse(profile.course));

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
  }, [profile, universities]);

  useEffect(() => {
    if (profile?.signedIn && profile?.name) {
      api.listRedemptions(profile.name).then(setCodes).catch(() => {});
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

  const handleSaveCard = async (e, section) => {
    e.preventDefault();
    if (!profile?.id) return;

    const changes = {};

    if (section === 'personal') {
      if (editName.trim().length < 2) {
        toast({ title: 'Ism va familiyangizni to‘liq kiriting', variant: 'destructive' });
        return;
      }
      if (editBirthDate && editBirthDate.length !== 10) {
        toast({
          title: 'Tug‘ilgan sanani KK.OO.YYYY formatida to‘liq kiriting',
          variant: 'destructive',
        });
        return;
      }
      changes.full_name = editName.trim();
      changes.name = editName.trim();
      changes.gender = editGender;
      changes.birth_date = editBirthDate.trim();
    } else if (section === 'education') {
      if (editUniversity === 'Boshqa' && editCustomInstitution.trim().length < 2) {
        toast({ title: "Ta'lim muassasangiz nomini kiriting", variant: 'destructive' });
        return;
      }
      if (editCourse && !COURSE_OPTIONS.includes(String(editCourse))) {
        toast({ title: 'Kurs 1 dan 6 gacha bo‘lishi kerak', variant: 'destructive' });
        return;
      }
      const finalUni =
        editUniversity === 'Boshqa' ? editCustomInstitution.trim() : editUniversity;
      changes.region = editRegion;
      changes.university = finalUni;
      changes.course = editCourse ? String(editCourse) : '';
    } else if (section === 'contact') {
      const phoneDigits = editPhone.replace(/\D/g, '');
      if (phoneDigits.length > 0 && phoneDigits.length !== 9) {
        toast({
          title: 'Telefon raqamni 9 ta raqam bilan to‘liq kiriting',
          variant: 'destructive',
        });
        return;
      }
      changes.phone = phoneDigits ? `+998 ${formatUzPhone(phoneDigits)}` : '';
    }

    setSavingProfile(true);
    try {
      await updateProfile(changes);
      setEditingCard(null);
      toast({ title: 'Ma’lumotlar muvaffaqiyatli saqlandi!' });
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

  const currentTabMeta =
    PROFILE_TABS.find((item) => item.id === activeTab) || PROFILE_TABS[0];

  const breadcrumbs =
    activeTab === 'overview'
      ? [{ label: 'Mening profilim' }]
      : [
          {
            label: 'Mening profilim',
            onClick: () => {
              setActiveTab('overview');
              setEditingCard(null);
            },
          },
          { label: currentTabMeta.label },
        ];

  if (!profile?.signedIn) {
    return (
      <AppShell breadcrumbs={[{ label: 'Mening profilim' }]}>
        <div className="mx-auto mt-6 max-w-md rounded-[28px] border border-slate-200/80 bg-white/90 p-7 text-center shadow-lg backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#002D96] to-[#00A9FF] text-white shadow-md">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-[21px] font-extrabold text-[#08123A] dark:text-white">
            Shaxsiy kabinet
          </h1>
          <p className="mx-auto mt-1.5 max-w-[290px] text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
            Ro‘yxatdan o‘ting va talabalik guvohnomangizni tasdiqlab, barcha hamkorlar
            chegirmalaridan foydalaning.
          </p>

          <div className="mt-6 space-y-2.5">
            <Link
              to="/welcome?mode=signup"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-bold text-white shadow-md"
            >
              <UserPlus className="h-4 w-4" />
              Ro‘yxatdan o‘tish
            </Link>
            <Link
              to="/welcome?mode=signin"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-[13px] font-bold text-[#08123A] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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

  const genderLabel =
    profile.gender === 'male'
      ? 'O‘g‘il bola'
      : profile.gender === 'female'
        ? 'Qiz bola'
        : 'Kiritilmagan';

  const courseLabel = profile.course ? `${profile.course}-kurs` : 'Kiritilmagan';

  return (
    <AppShell breadcrumbs={breadcrumbs}>
      <div className="mx-auto max-w-5xl pb-10">
        {/* MOBIL GORIZONTAL TABLAR */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden">
          {PROFILE_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setEditingCard(null);
                }}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[12.5px] font-bold transition-all',
                  active
                    ? 'bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white shadow-sm'
                    : 'border border-slate-200 bg-white/90 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* MARKAZLASHTIRILGAN GRID LAYOUT: Chap navigatsiya + O'ng kartalar */}
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">
          {/* CHAP SIDEBAR (Kartali profil mini-header + navigatsiya menyusi) */}
          <aside className="space-y-4 md:col-span-4 lg:col-span-3">
            {/* Compact Identity Card */}
            <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
              <div className="flex items-center gap-3.5 md:flex-col md:text-center">
                <label className="group relative grid h-16 w-16 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#002D96] via-[#1D6FF2] to-[#00A9FF] text-[20px] font-black text-white shadow-md">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
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

                <div className="min-w-0 flex-1 md:w-full">
                  <p className="truncate text-[16px] font-extrabold text-[#08123A] dark:text-white">
                    {profile.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[11.5px] font-bold text-[#1D6FF2] dark:text-sky-400">
                    ID: #{profile.student_id}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5 md:justify-center">
                    <VerificationPill status={profile.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Menu Card */}
            <nav className="hidden rounded-[24px] border border-slate-200/80 bg-white/90 p-2.5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 md:block">
              <ul className="space-y-1">
                {PROFILE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <li key={tab.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id);
                          setEditingCard(null);
                        }}
                        className={cn(
                          'flex w-full items-center justify-between gap-2.5 rounded-full px-4 py-2.5 text-left text-[13px] font-bold transition-all',
                          active
                            ? 'bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white shadow-[0_10px_24px_-12px_rgba(0,45,150,0.9)]'
                            : 'text-slate-700 hover:bg-slate-100/80 hover:text-[#002D96] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-300'
                        )}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{tab.label}</span>
                        </span>
                        {tab.id === 'codes' && codes.length > 0 && (
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10.5px] font-extrabold',
                              active
                                ? 'bg-white/20 text-white'
                                : 'bg-[#1D6FF2]/10 text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300'
                            )}
                          >
                            {codes.length}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}

                <li>
                  <Link
                    to="/settings"
                    className="flex w-full items-center gap-2.5 rounded-full px-4 py-2.5 text-[13px] font-bold text-slate-700 transition-colors hover:bg-slate-100/80 hover:text-[#002D96] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-300"
                  >
                    <SettingsIcon className="h-4 w-4 shrink-0" />
                    <span>Sozlamalar</span>
                  </Link>
                </li>
              </ul>

              <div className="my-2.5 border-t border-slate-100 dark:border-slate-800" />

              <ul className="space-y-1">
                <li>
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-between gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-[#002D96] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-300"
                  >
                    <span className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 shrink-0" />
                      <span>Foydalanish shartlari</span>
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </li>
                <li>
                  <a
                    href="/help"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-between gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-[#002D96] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-300"
                  >
                    <span className="flex items-center gap-2.5">
                      <HelpCircle className="h-4 w-4 shrink-0" />
                      <span>Yordam (Help)</span>
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="flex w-full items-center gap-2.5 rounded-full px-4 py-2 text-left text-[12.5px] font-bold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>Chiqish</span>
                  </button>
                </li>
              </ul>
            </nav>
          </aside>

          {/* O'NG KONTENT QISMI (Alohida kartalar va grid) */}
          <div className="space-y-5 md:col-span-8 lg:col-span-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-[24px] font-black tracking-tight text-[#08123A] dark:text-white md:text-[28px]">
                  {currentTabMeta.label}
                </h1>
                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  {activeTab === 'overview'
                    ? 'Raqamli talaba kartangiz, holatingiz va tezkor ko‘rsatkichlar'
                    : activeTab === 'status'
                      ? 'Talabalik guvohnomasi va tasdiqlash holati'
                      : activeTab === 'data'
                        ? 'Shaxsiy, ta’lim va aloqa ma’lumotlaringizni boshqaring'
                        : 'Faollashtirilgan chegirma va promo-kodlaringiz'}
                </p>
              </div>

              <Link
                to="/settings"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3.5 py-2 text-[12px] font-bold text-[#002D96] shadow-sm transition-colors hover:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-900 dark:text-sky-300 md:hidden"
              >
                <SettingsIcon className="h-3.5 w-3.5" />
                Sozlamalar
              </Link>
            </div>

            {/* TAB 1: MENING PROFILIM (OVERVIEW BENTO GRID) */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                  {/* Raqamli Talaba Kartasi */}
                  <div className="lg:col-span-7">
                    <StudentCard />
                  </div>

                  {/* Tezkor ko'rsatkichlar kartasi */}
                  <div className="flex flex-col justify-between gap-4 rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 lg:col-span-5">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                        Tezkor statistika
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveTab('codes')}
                          className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 text-left transition-colors hover:border-[#1D6FF2]/40 dark:border-slate-800 dark:bg-slate-800/70"
                        >
                          <Ticket className="h-4 w-4 text-[#1D6FF2] dark:text-sky-400" />
                          <p className="mt-2 text-[22px] font-black leading-none text-[#08123A] dark:text-white">
                            {codes.length}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Promo kodlar
                          </p>
                        </button>

                        <Link
                          to="/explore?saved=1"
                          className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 text-left transition-colors hover:border-[#1D6FF2]/40 dark:border-slate-800 dark:bg-slate-800/70"
                        >
                          <Heart className="h-4 w-4 text-rose-500" />
                          <p className="mt-2 text-[22px] font-black leading-none text-[#08123A] dark:text-white">
                            {likedCount}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Saqlanganlar
                          </p>
                        </Link>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#002D96]/[0.05] px-3.5 py-3 text-[12px] font-semibold text-[#002D96] dark:bg-sky-500/10 dark:text-sky-300">
                      {t(note)}
                    </div>

                    {profile.status !== 'verified' && (
                      <Button
                        onClick={() => setVerifyOpen(true)}
                        className="h-10 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[12.5px] font-bold text-white shadow-sm"
                      >
                        <ShieldCheck className="mr-1.5 h-4 w-4" />
                        {profile.status === 'rejected'
                          ? 'Hujjatni qaytadan yuklash'
                          : t('verify.cta')}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Pastki 2 ustunli qisqa ma'lumot kartalari */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                      <h2 className="text-[14.5px] font-extrabold text-[#08123A] dark:text-white">
                        Shaxsiy ma’lumotlar
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('data');
                          setEditingCard('personal');
                        }}
                        className="inline-flex items-center gap-1 text-[12px] font-bold text-[#1D6FF2] hover:underline dark:text-sky-400"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Tahrirlash
                      </button>
                    </div>
                    <dl className="mt-3.5 space-y-2.5 text-[13px]">
                      <div>
                        <dt className="text-[11px] font-semibold text-slate-400">Ism va familiya</dt>
                        <dd className="font-bold text-[#08123A] dark:text-slate-100">
                          {profile.name || '—'}
                        </dd>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <dt className="text-[11px] font-semibold text-slate-400">Tug‘ilgan sana</dt>
                          <dd className="font-bold text-[#08123A] dark:text-slate-100">
                            {profile.birth_date || 'Kiritilmagan'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[11px] font-semibold text-slate-400">Jinsi</dt>
                          <dd className="font-bold text-[#08123A] dark:text-slate-100">
                            {genderLabel}
                          </dd>
                        </div>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                      <h2 className="text-[14.5px] font-extrabold text-[#08123A] dark:text-white">
                        Ta’lim ma’lumotlari
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('data');
                          setEditingCard('education');
                        }}
                        className="inline-flex items-center gap-1 text-[12px] font-bold text-[#1D6FF2] hover:underline dark:text-sky-400"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Tahrirlash
                      </button>
                    </div>
                    <dl className="mt-3.5 space-y-2.5 text-[13px]">
                      <div>
                        <dt className="text-[11px] font-semibold text-slate-400">
                          Ta’lim muassasasi
                        </dt>
                        <dd className="truncate font-bold text-[#08123A] dark:text-slate-100">
                          {profile.university || 'Kiritilmagan'}
                        </dd>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <dt className="text-[11px] font-semibold text-slate-400">Kurs</dt>
                          <dd className="font-bold text-[#1D6FF2] dark:text-sky-400">
                            {courseLabel}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[11px] font-semibold text-slate-400">Viloyat</dt>
                          <dd className="truncate font-bold text-[#08123A] dark:text-slate-100">
                            {profile.region || 'Kiritilmagan'}
                          </dd>
                        </div>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TALABALIK STATUSI */}
            {activeTab === 'status' && (
              <div className="space-y-5">
                <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div>
                      <p className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400">
                        Joriy holat
                      </p>
                      <h2 className="mt-1 text-[18px] font-extrabold text-[#08123A] dark:text-white">
                        Talabalik tasdiqlanishi
                      </h2>
                    </div>
                    <VerificationPill status={profile.status} />
                  </div>

                  <div className="mt-4 space-y-3">
                    {profile.status === 'rejected' && (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3.5 text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300">
                        <div className="flex items-center gap-2 text-[13px] font-extrabold">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                          <span>Hujjatingiz rad etildi</span>
                        </div>
                        <p className="mt-1 text-[12.5px] font-semibold">
                          Sabab:{' '}
                          <span className="font-bold">
                            {profile.rejection_reason ||
                              'Hujjat talabga javob bermaydi. Iltimos, sifatliroq nusxasini qayta yuklang.'}
                          </span>
                        </p>
                        {profile.reviewed_by && (
                          <p className="mt-1 text-[11px] font-medium opacity-80">
                            Tekshirdi: <strong>{profile.reviewed_by}</strong>
                          </p>
                        )}
                      </div>
                    )}

                    {profile.status === 'verified' && profile.reviewed_by && (
                      <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-[12.5px] font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>Tasdiqladi: {profile.reviewed_by}</span>
                      </div>
                    )}

                    <p className="rounded-2xl bg-[#002D96]/[0.05] px-4 py-3.5 text-[13px] font-medium leading-relaxed text-[#002D96] dark:bg-sky-500/10 dark:text-sky-300">
                      {t(note)}
                    </p>

                    <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                        <p className="text-[11px] font-bold text-slate-400">Yuklangan hujjat</p>
                        <p className="mt-1 truncate text-[13px] font-extrabold text-[#08123A] dark:text-white">
                          {profile.document_name || 'Hali yuklanmagan'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                        <p className="text-[11px] font-bold text-slate-400">OTM va kurs</p>
                        <p className="mt-1 truncate text-[13px] font-extrabold text-[#08123A] dark:text-white">
                          {profile.university || 'Kiritilmagan'}
                          {profile.course ? ` · ${profile.course}-kurs` : ''}
                        </p>
                      </div>
                    </div>

                    {profile.status !== 'verified' && (
                      <Button
                        onClick={() => setVerifyOpen(true)}
                        className="mt-2 h-11 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-bold text-white shadow-md sm:w-auto sm:px-8"
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        {profile.status === 'rejected'
                          ? 'Hujjatni qaytadan yuklash'
                          : t('verify.cta')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MENING MA'LUMOTLARIM (3 TA ALOHIDA ZAMONAVIY KARTA + KURS 1–6) */}
            {activeTab === 'data' && (
              <div className="space-y-4">
                {/* KARTA 1: SHAXSIY MA'LUMOTLAR */}
                <section className="rounded-[24px] border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#002D96]/10 text-[#002D96] dark:bg-sky-500/15 dark:text-sky-400">
                        <User className="h-4.5 w-4.5" />
                      </span>
                      <h2 className="text-[15.5px] font-extrabold text-[#08123A] dark:text-white">
                        Shaxsiy ma’lumotlar
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingCard(editingCard === 'personal' ? null : 'personal')
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-bold text-[#1D6FF2] transition-colors hover:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-sky-400"
                    >
                      {editingCard === 'personal' ? (
                        <>
                          <X className="h-3.5 w-3.5" />
                          <span>Yopish</span>
                        </>
                      ) : (
                        <>
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Tahrirlash</span>
                        </>
                      )}
                    </button>
                  </div>

                  {editingCard === 'personal' ? (
                    <form
                      onSubmit={(e) => handleSaveCard(e, 'personal')}
                      className="mt-4 space-y-3.5"
                    >
                      <div>
                        <label className="mb-1 block text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                          Ism va familiya
                        </label>
                        <input
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#08123A] outline-none focus:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                            Tug‘ilgan sana (KK.OO.YYYY)
                          </label>
                          <input
                            value={editBirthDate}
                            onChange={(e) => setEditBirthDate(formatBirthDateMask(e.target.value))}
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="05.07.2005"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#08123A] outline-none focus:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                            Jinsi
                          </label>
                          <select
                            value={editGender}
                            onChange={(e) => setEditGender(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#08123A] outline-none focus:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          >
                            <option value="">Tanlanmagan</option>
                            <option value="male">O‘g‘il bola</option>
                            <option value="female">Qiz bola</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingCard(null)}
                          className="h-9 rounded-full px-4 text-[12px] font-bold dark:border-slate-700 dark:text-slate-200"
                        >
                          Bekor qilish
                        </Button>
                        <Button
                          type="submit"
                          disabled={savingProfile}
                          className="h-9 rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] px-5 text-[12px] font-bold text-white"
                        >
                          <Check className="mr-1.5 h-3.5 w-3.5" />
                          {savingProfile ? 'Saqlanmoqda...' : 'Saqlash'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <dt className="text-[11.5px] font-semibold text-slate-400">
                          Ism va familiya
                        </dt>
                        <dd className="mt-0.5 text-[14px] font-bold text-[#08123A] dark:text-slate-100">
                          {profile.name || 'Kiritilmagan'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11.5px] font-semibold text-slate-400">
                          Tug‘ilgan sana
                        </dt>
                        <dd className="mt-0.5 text-[14px] font-bold text-[#08123A] dark:text-slate-100">
                          {profile.birth_date || 'Kiritilmagan'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11.5px] font-semibold text-slate-400">Jinsi</dt>
                        <dd className="mt-0.5 text-[14px] font-bold text-[#08123A] dark:text-slate-100">
                          {genderLabel}
                        </dd>
                      </div>
                    </dl>
                  )}
                </section>

                {/* KARTA 2: TA'LIM MA'LUMOTLARI (VILOYAT, OTM VA KURS 1-6) */}
                <section className="rounded-[24px] border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1D6FF2]/10 text-[#1D6FF2] dark:bg-sky-500/15 dark:text-sky-400">
                        <GraduationCap className="h-4.5 w-4.5" />
                      </span>
                      <h2 className="text-[15.5px] font-extrabold text-[#08123A] dark:text-white">
                        Ta’lim ma’lumotlari
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingCard(editingCard === 'education' ? null : 'education')
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-bold text-[#1D6FF2] transition-colors hover:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-sky-400"
                    >
                      {editingCard === 'education' ? (
                        <>
                          <X className="h-3.5 w-3.5" />
                          <span>Yopish</span>
                        </>
                      ) : (
                        <>
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Tahrirlash</span>
                        </>
                      )}
                    </button>
                  </div>

                  {editingCard === 'education' ? (
                    <form
                      onSubmit={(e) => handleSaveCard(e, 'education')}
                      className="mt-4 space-y-3.5"
                    >
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                            Viloyat
                          </label>
                          <select
                            value={editRegion}
                            onChange={(e) => {
                              setEditRegion(e.target.value);
                              setEditUniversity('');
                              setEditCustomInstitution('');
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#08123A] outline-none focus:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          >
                            <option value="">Viloyatni tanlang</option>
                            {REGIONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                            Kurs (1–6)
                          </label>
                          <select
                            value={editCourse}
                            onChange={(e) => setEditCourse(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#08123A] outline-none focus:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          >
                            <option value="">Kursingizni tanlang</option>
                            {COURSE_OPTIONS.map((c) => (
                              <option key={c} value={c}>
                                {c}-kurs
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                          Oliy ta’lim muassasasi
                        </label>
                        <select
                          value={editUniversity}
                          onChange={(e) => {
                            setEditUniversity(e.target.value);
                            if (e.target.value !== 'Boshqa') setEditCustomInstitution('');
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#08123A] outline-none focus:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                          <option value="">Tanlang...</option>
                          {filteredUniversities.map((u) => {
                            const name = typeof u === 'string' ? u : u.name;
                            const shortName =
                              typeof u === 'object' && u.short_name ? u.short_name : '';
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
                          <label className="mb-1 block text-[11.5px] font-bold text-[#002D96] dark:text-sky-300">
                            Ta’lim muassasangiz nomi
                          </label>
                          <input
                            required
                            value={editCustomInstitution}
                            onChange={(e) => setEditCustomInstitution(e.target.value)}
                            placeholder="Ta’lim muassasangiz nomini yozing"
                            className="w-full rounded-xl border border-[#1D6FF2]/50 bg-[#1D6FF2]/[0.04] px-3.5 py-2.5 text-[13px] font-semibold text-[#08123A] outline-none focus:border-[#1D6FF2] dark:bg-sky-500/10 dark:text-white"
                          />
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingCard(null)}
                          className="h-9 rounded-full px-4 text-[12px] font-bold dark:border-slate-700 dark:text-slate-200"
                        >
                          Bekor qilish
                        </Button>
                        <Button
                          type="submit"
                          disabled={savingProfile}
                          className="h-9 rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] px-5 text-[12px] font-bold text-white"
                        >
                          <Check className="mr-1.5 h-3.5 w-3.5" />
                          {savingProfile ? 'Saqlanmoqda...' : 'Saqlash'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <dt className="flex items-center gap-1 text-[11.5px] font-semibold text-slate-400">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>Oliy ta’lim muassasasi</span>
                        </dt>
                        <dd className="mt-0.5 text-[14px] font-bold text-[#08123A] dark:text-slate-100">
                          {profile.university || 'Kiritilmagan'}
                        </dd>
                      </div>
                      <div>
                        <dt className="flex items-center gap-1 text-[11.5px] font-semibold text-slate-400">
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Kurs</span>
                        </dt>
                        <dd className="mt-0.5 text-[14px] font-extrabold text-[#1D6FF2] dark:text-sky-400">
                          {courseLabel}
                        </dd>
                      </div>
                      <div className="sm:col-span-3">
                        <dt className="flex items-center gap-1 text-[11.5px] font-semibold text-slate-400">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>Viloyat</span>
                        </dt>
                        <dd className="mt-0.5 text-[14px] font-bold text-[#08123A] dark:text-slate-100">
                          {profile.region || 'Kiritilmagan'}
                        </dd>
                      </div>
                    </dl>
                  )}
                </section>

                {/* KARTA 3: ALOQA MA'LUMOTLARI (TELEFON + EMAIL) */}
                <section className="rounded-[24px] border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                        <Phone className="h-4.5 w-4.5" />
                      </span>
                      <h2 className="text-[15.5px] font-extrabold text-[#08123A] dark:text-white">
                        Aloqa ma’lumotlari
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingCard(editingCard === 'contact' ? null : 'contact')
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-bold text-[#1D6FF2] transition-colors hover:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-sky-400"
                    >
                      {editingCard === 'contact' ? (
                        <>
                          <X className="h-3.5 w-3.5" />
                          <span>Yopish</span>
                        </>
                      ) : (
                        <>
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Tahrirlash</span>
                        </>
                      )}
                    </button>
                  </div>

                  {editingCard === 'contact' ? (
                    <form
                      onSubmit={(e) => handleSaveCard(e, 'contact')}
                      className="mt-4 space-y-3.5"
                    >
                      <div>
                        <label className="mb-1 block text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                          Telefon raqam
                        </label>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800">
                          <span className="text-[13px] font-extrabold text-[#002D96] dark:text-sky-400">
                            +998
                          </span>
                          <input
                            value={editPhone}
                            onChange={(e) => setEditPhone(formatUzPhone(e.target.value))}
                            inputMode="numeric"
                            placeholder="99 999 99 99"
                            className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingCard(null)}
                          className="h-9 rounded-full px-4 text-[12px] font-bold dark:border-slate-700 dark:text-slate-200"
                        >
                          Bekor qilish
                        </Button>
                        <Button
                          type="submit"
                          disabled={savingProfile}
                          className="h-9 rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] px-5 text-[12px] font-bold text-white"
                        >
                          <Check className="mr-1.5 h-3.5 w-3.5" />
                          {savingProfile ? 'Saqlanmoqda...' : 'Saqlash'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="flex items-center gap-1 text-[11.5px] font-semibold text-slate-400">
                          <Phone className="h-3.5 w-3.5" />
                          <span>Telefon raqam</span>
                        </dt>
                        <dd className="mt-0.5 text-[14px] font-bold text-[#08123A] dark:text-slate-100">
                          {profile.phone || 'Kiritilmagan'}
                        </dd>
                      </div>
                      <div>
                        <dt className="flex items-center gap-1 text-[11.5px] font-semibold text-slate-400">
                          <Mail className="h-3.5 w-3.5" />
                          <span>Elektron pochta</span>
                        </dt>
                        <dd className="mt-0.5 truncate text-[14px] font-bold text-[#08123A] dark:text-slate-100">
                          {profile.email || 'Kiritilmagan'}
                        </dd>
                      </div>
                    </dl>
                  )}
                </section>
              </div>
            )}

            {/* TAB 4: PROMO KODLARIM */}
            {activeTab === 'codes' && (
              <section id="codes">
                {codes.length ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {codes.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 rounded-[22px] border border-slate-200/80 bg-white/95 px-4 py-3.5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#002D96]/10 text-[#002D96] dark:bg-sky-500/15 dark:text-sky-400">
                          {c.redemption_type === 'app' ? (
                            <Smartphone className="h-4.5 w-4.5" />
                          ) : (
                            <QrCode className="h-4.5 w-4.5" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-extrabold text-[#08123A] dark:text-white">
                            {c.brand_name}
                          </p>
                          <p className="truncate font-mono text-[12px] font-bold text-[#1D6FF2] dark:text-sky-400">
                            {c.code}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label="Nusxalash"
                          onClick={async () => {
                            await copyText(c.code);
                            toast({ title: t('toast.copied'), description: c.code });
                          }}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-50 text-[#002D96] transition-colors hover:bg-[#1D6FF2] hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/60">
                    <Ticket className="mx-auto h-7 w-7 text-slate-400" />
                    <p className="mt-2.5 text-[14.5px] font-extrabold text-[#08123A] dark:text-white">
                      {t('profile.noCodes')}
                    </p>
                    <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">
                      {t('profile.empty')}
                    </p>
                    <Link
                      to="/"
                      className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] px-6 text-[12.5px] font-bold text-white shadow-sm"
                    >
                      Chegirmalarni ko‘rish
                    </Link>
                  </div>
                )}
              </section>
            )}

            {/* MOBILDA QO'SHIMCHA HAVOLALAR VA CHIQISH */}
            <div className="grid grid-cols-1 gap-2.5 pt-2 md:hidden">
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white/90 py-3 text-[12px] font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <FileText className="h-3.5 w-3.5 text-[#1D6FF2]" />
                  <span>Shartlar</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
                <a
                  href="/help"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white/90 py-3 text-[12px] font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-[#1D6FF2]" />
                  <span>Yordam</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50/90 text-[12.5px] font-bold text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-400"
              >
                <LogOut className="h-4 w-4" />
                <span>Chiqish</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#08123A]/55 p-4 backdrop-blur-sm"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-[26px] border border-white/80 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[16px] font-extrabold text-[#08123A] dark:text-white">
              Tizimdan chiqish
            </h3>
            <p className="mt-1.5 text-[13px] text-slate-600 dark:text-slate-300">
              Haqiqatan ham tizimdan chiqmoqchimisiz?
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-full border border-slate-200 bg-white py-2.5 text-[12.5px] font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
