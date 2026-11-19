import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Building2,
  Check,
  ChevronRight,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  KeyRound,
  Layers,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Plus,
  QrCode,
  RotateCcw,
  Search,
  ShieldCheck,
  Smartphone,
  Store,
  Tag,
  Ticket,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import BrandForm from '@/components/admin/BrandForm';
import OfferForm from '@/components/admin/OfferForm';
import VerificationPill from '@/components/VerificationPill';
import { CATEGORY_ICON_MAP } from '@/components/CategoryPills';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useLang } from '@/lib/LanguageContext';
import { useStudent } from '@/lib/StudentContext';
import {
  ADMIN_PERMISSION_LIST,
  api,
  AVAILABLE_SECTIONS,
  DEFAULT_CATEGORIES,
} from '@/services/api';
import { localizedTitle } from '@/lib/deal';
import { cn } from '@/lib/utils';
import { REGIONS } from '@/pages/Welcome';

const ALL_SECTIONS = [
  { id: 'stats', label: 'Statistika', icon: BarChart3 },
  { id: 'students', label: 'Talabalar', icon: Users },
  { id: 'deals', label: 'Brend va e’lonlar', icon: Store },
  { id: 'categories', label: 'Kategoriyalar', icon: Layers },
  { id: 'universities', label: 'Universitetlar', icon: Building2 },
  { id: 'admins', label: 'Adminlar va Huquqlar', icon: KeyRound, superOnly: true },
];

const STUDENT_TABS = [
  { id: 'pending', label: 'Kutilmoqda' },
  { id: 'verified', label: 'Tasdiqlangan' },
  { id: 'rejected', label: 'Rad etilgan' },
  { id: 'unverified', label: 'Hujjatsiz' },
  { id: 'all', label: 'Hamma talabalar' },
];

const ICON_OPTIONS = Object.keys(CATEGORY_ICON_MAP || {});

function formatUtcPlus5(isoString) {
  if (!isoString) return 'Ma’lumot yo‘q';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Ma’lumot yo‘q';
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  const tashkent = new Date(utcMs + 5 * 3600000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(tashkent.getDate())}.${pad(tashkent.getMonth() + 1)}.${tashkent.getFullYear()} · ${pad(tashkent.getHours())}:${pad(tashkent.getMinutes())} (UTC+5)`;
}

function normalizeAdminSession(rawSession) {
  if (!rawSession || typeof rawSession !== 'object') return null;
  const loginStr = String(rawSession.login || '').toLowerCase();
  const isSuper =
    Boolean(rawSession.isSuper) ||
    rawSession.role === 'superadmin' ||
    loginStr === 'admin';
  const defaultPerms = isSuper
    ? ['stats', 'students', 'deals', 'categories', 'universities', 'admins']
    : ['stats', 'students'];
  return {
    ...rawSession,
    name: rawSession.name || rawSession.login || 'Admin',
    login: rawSession.login || 'admin',
    isSuper,
    permissions:
      Array.isArray(rawSession.permissions) && rawSession.permissions.length > 0
        ? rawSession.permissions
        : defaultPerms,
  };
}

export default function Admin() {
  const { t, lang } = useLang();
  const { toast } = useToast();
  const { reload } = useStudent();

  const [session, setSession] = useState(() => normalizeAdminSession(api.getAdminSession()));
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [section, setSection] = useState('stats');

  // Talabalar
  const [profiles, setProfiles] = useState([]);
  const [allRedemptions, setAllRedemptions] = useState([]);
  const [studentTab, setStudentTab] = useState('pending');
  const [studentSearch, setStudentSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterUniversity, setFilterUniversity] = useState('');
  const [filterStatusInAll, setFilterStatusInAll] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [previewDocPerson, setPreviewDocPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [showRejectInputInModal, setShowRejectInputInModal] = useState(false);
  const [reason, setReason] = useState('');

  // Brendlar (Vertikal A-Z ro'yxat + ichiga kirish)
  const [brands, setBrands] = useState([]);
  const [brandSearch, setBrandSearch] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [offers, setOffers] = useState([]);
  const [allOffersCount, setAllOffersCount] = useState(0);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);

  // Kategoriyalar
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES || []);
  const [editingCatId, setEditingCatId] = useState(null);
  const [catIdInput, setCatIdInput] = useState('');
  const [catLabelUz, setCatLabelUz] = useState('');
  const [catLabelRu, setCatLabelRu] = useState('');
  const [catLabelEn, setCatLabelEn] = useState('');
  const [catIcon, setCatIcon] = useState('Utensils');

  // Universitetlar
  const [universities, setUniversities] = useState([]);
  const [uniViewMode, setUniViewMode] = useState('all');
  const [activeRegionCard, setActiveRegionCard] = useState(REGIONS[0] || 'Toshkent shahri');
  const [uniSearchQuery, setUniSearchQuery] = useState('');
  const [newUniName, setNewUniName] = useState('');
  const [newUniShort, setNewUniShort] = useState('');
  const [newUniRegion, setNewUniRegion] = useState(REGIONS[0] || 'Toshkent shahri');

  // Talaba o'zi yozgan ("Boshqa") universitetni tasdiqlash
  const [approvingCustomUni, setApprovingCustomUni] = useState(null);
  const [customApproveName, setCustomApproveName] = useState('');
  const [customApproveShort, setCustomApproveShort] = useState('');
  const [customApproveRegion, setCustomApproveRegion] = useState(REGIONS[0] || 'Toshkent shahri');
  const [savingCustomUni, setSavingCustomUni] = useState(false);

  // Adminlar
  const [admins, setAdmins] = useState([]);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminLogin, setNewAdminLogin] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [newAdminPerms, setNewAdminPerms] = useState(['stats', 'students']);

  // BARCHA HOOK'LAR SHU YERDA (early return'dan TEPADA — Logout oq ekran bo'lmasligi uchun!)
  const allowedSections = useMemo(() => {
    if (!session) return [];
    const isSuper = Boolean(session.isSuper);
    const perms = Array.isArray(session.permissions)
      ? session.permissions
      : ['stats', 'students'];
    return ALL_SECTIONS.filter((sec) => {
      if (sec.superOnly) return isSuper;
      return isSuper || perms.includes(sec.id);
    });
  }, [session]);

  const alphabetSortedBrands = useMemo(() => {
    const q = brandSearch.trim().toLowerCase();
    return [...brands]
      .filter(Boolean)
      .filter(
        (b) =>
          !q ||
          (b.name || '').toLowerCase().includes(q) ||
          (b.discount || '').toLowerCase().includes(q)
      )
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'uz'));
  }, [brands, brandSearch]);

  const alphabetSortedUniversities = useMemo(() => {
    const q = uniSearchQuery.trim().toLowerCase();
    return [...universities]
      .filter(Boolean)
      .filter((u) => {
        const name = (typeof u === 'string' ? u : u?.name || '').toLowerCase();
        const short = (typeof u === 'object' && u?.short_name ? u.short_name : '').toLowerCase();
        return !q || name.includes(q) || short.includes(q);
      })
      .sort((a, b) => {
        const nameA = typeof a === 'string' ? a : a?.name || '';
        const nameB = typeof b === 'string' ? b : b?.name || '';
        return String(nameA).localeCompare(String(nameB), 'uz');
      });
  }, [universities, uniSearchQuery]);

  const regionFilteredUniversities = useMemo(() => {
    const norm = (r) =>
      String(r || '')
        .toLowerCase()
        .replace(/viloyati|shahri|respublikasi/g, '')
        .trim();
    const targetNorm = norm(activeRegionCard);

    return alphabetSortedUniversities.filter((u) => {
      if (!u || typeof u === 'string') return false;
      if (!u.region) return false;
      return u.region === activeRegionCard || norm(u.region) === targetNorm;
    });
  }, [alphabetSortedUniversities, activeRegionCard]);

  const studentWrittenUniversities = useMemo(() => {
    const officialNamesSet = new Set(
      universities
        .filter(Boolean)
        .map((u) => (typeof u === 'string' ? u : u?.name || '').trim().toLowerCase())
    );

    const groupsMap = new Map();
    profiles.forEach((p) => {
      const rawUni = String(p.university || '').trim();
      if (!rawUni || rawUni.toLowerCase() === 'boshqa') return;
      const cleanName = rawUni.replace(/^Boshqa\s*-\s*/i, '').trim();
      if (!cleanName) return;

      const isOfficial = officialNamesSet.has(cleanName.toLowerCase());
      if (isOfficial && !rawUni.toLowerCase().startsWith('boshqa')) return;

      const key = cleanName.toLowerCase();
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          rawName: rawUni,
          cleanName,
          suggestedRegion: p.region || REGIONS[0] || 'Toshkent shahri',
          students: [],
        });
      }
      groupsMap.get(key).students.push(p);
    });

    const q = uniSearchQuery.trim().toLowerCase();
    return Array.from(groupsMap.values())
      .filter((item) => !q || item.cleanName.toLowerCase().includes(q))
      .sort((a, b) => a.cleanName.localeCompare(b.cleanName, 'uz'));
  }, [profiles, universities, uniSearchQuery]);

  useEffect(() => {
    if (allowedSections.length > 0 && !allowedSections.some((s) => s.id === section)) {
      setSection(allowedSections[0].id);
    }
  }, [allowedSections, section]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pList, bList, oList, rList, uList, aList, cList] = await Promise.all([
        api.listProfiles ? api.listProfiles().catch(() => []) : Promise.resolve([]),
        api.listBrands ? api.listBrands().catch(() => []) : Promise.resolve([]),
        api.listAllOffers ? api.listAllOffers().catch(() => []) : Promise.resolve([]),
        api.listRedemptions ? api.listRedemptions().catch(() => []) : Promise.resolve([]),
        api.listUniversitiesAdmin
          ? api.listUniversitiesAdmin().catch(() => [])
          : Promise.resolve([]),
        api.listAdmins ? api.listAdmins().catch(() => []) : Promise.resolve([]),
        api.listCategories
          ? api.listCategories().catch(() => DEFAULT_CATEGORIES)
          : Promise.resolve(DEFAULT_CATEGORIES),
      ]);
      setProfiles(Array.isArray(pList) ? pList : []);
      setBrands(Array.isArray(bList) ? bList : []);
      setAllOffersCount(Array.isArray(oList) ? oList.length : 0);
      setAllRedemptions(Array.isArray(rList) ? rList : []);
      setUniversities(Array.isArray(uList) ? uList.filter(Boolean) : []);
      setAdmins(Array.isArray(aList) ? aList : []);
      setCategories(Array.isArray(cList) ? cList : DEFAULT_CATEGORIES || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) loadAll();
  }, [session]);

  useEffect(() => {
    if (session && selectedBrandId && api.listOffers) {
      api.listOffers(selectedBrandId).then((res) => setOffers(Array.isArray(res) ? res : []));
    }
  }, [session, selectedBrandId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const user = await api.loginAdmin(loginInput, passwordInput);
    if (!user) {
      setLoginError('Login yoki parol noto‘g‘ri');
      return;
    }
    setLoginError('');
    setSession(normalizeAdminSession(user));
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    setSelectedStudent(null);
    setPreviewDocPerson(null);
    setSelectedBrandId(null);
    api.logoutAdmin();
    setSession(null);
    setLoginInput('');
    setPasswordInput('');
  };

  // AGAR TIZIMGA KIRILMAGAN BO'LSA -> LOGIN EKRANI
  if (!session) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#F5F8FF] px-4">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-24 -top-32 h-[420px] w-[420px] rounded-full bg-[#00A9FF]/30 blur-[130px]" />
          <div className="absolute right-[-10%] bottom-[-10%] h-[380px] w-[380px] rounded-full bg-[#1D6FF2]/25 blur-[130px]" />
        </div>

        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-[28px] border border-white/80 bg-white/85 p-6 shadow-[0_24px_60px_-28px_rgba(0,45,150,0.65)] backdrop-blur-2xl"
        >
          <div className="mb-5 flex flex-col items-center text-center">
            <Logo size="sm" />
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#002D96]/8 px-3 py-1 text-[11px] font-bold text-[#002D96]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Boshqaruv paneli
            </div>
            <h1 className="mt-2 text-[20px] font-extrabold text-[#08123A]">Admin kirish</h1>
            <p className="mt-1 text-[12px] text-slate-500">
              Davom etish uchun admin login va parolini kiriting
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">Login</label>
              <input
                required
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="admin"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold outline-none focus:border-[#1D6FF2]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">Parol</label>
              <input
                required
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold outline-none focus:border-[#1D6FF2]"
              />
            </div>

            {loginError && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-center text-[11.5px] font-semibold text-rose-600">
                {loginError}
              </p>
            )}

            <Button
              type="submit"
              className="mt-2 h-11 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-bold text-white"
            >
              Kirish
            </Button>
          </div>
        </form>
      </div>
    );
  }

  const updateStudentStatus = async (person, status, rejection_reason = '') => {
    if (status === 'rejected' && !rejection_reason.trim()) {
      toast({
        title: 'Rad etish sababini kiriting',
        description: 'Talabaga nima uchun hujjati rad etilgani ko‘rinishi kerak.',
        variant: 'destructive',
      });
      return;
    }

    setBusyId(person.id);
    try {
      const reviewerLabel = `${session.name} (${session.isSuper ? 'Super Admin' : 'Moderator'})`;
      await api.setProfileStatus(person.id, status, rejection_reason.trim(), reviewerLabel);
      await reload?.();
      await loadAll();
      setShowRejectInputInModal(false);
      setReason('');
      if (selectedStudent?.id === person.id) {
        setSelectedStudent((prev) =>
          prev
            ? {
                ...prev,
                status,
                rejection_reason: status === 'verified' ? '' : rejection_reason.trim(),
                reviewed_by: reviewerLabel,
              }
            : null
        );
      }
      toast({
        title:
          status === 'verified'
            ? `${person.name} tasdiqlandi!`
            : `${person.name} arizasi rad etildi`,
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleBrandSection = async (brand, secId) => {
    const cur = Array.isArray(brand.sections) ? brand.sections : ['recommended'];
    const exists = cur.includes(secId);
    const nextSections = exists
      ? cur.length > 1
        ? cur.filter((s) => s !== secId)
        : cur
      : [...cur, secId];

    await api.updateBrand(brand.id, { sections: nextSections });
    await loadAll();
    toast({ title: `${brand.name} bo‘limlari yangilandi` });
  };

  const resetCategoryForm = () => {
    setEditingCatId(null);
    setCatIdInput('');
    setCatLabelUz('');
    setCatLabelRu('');
    setCatLabelEn('');
    setCatIcon('Utensils');
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catLabelUz.trim()) return;
    const updated = await api.saveCategory({
      id: editingCatId || catIdInput.trim() || catLabelUz.trim(),
      label_uz: catLabelUz.trim(),
      label_ru: catLabelRu.trim() || catLabelUz.trim(),
      label_en: catLabelEn.trim() || catLabelUz.trim(),
      icon: catIcon,
    });
    setCategories(Array.isArray(updated) ? updated : []);
    resetCategoryForm();
    toast({ title: editingCatId ? 'Kategoriya yangilandi' : 'Yangi kategoriya qo‘shildi' });
  };

  const handleMoveCategory = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= categories.length) return;
    const copy = [...categories];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    const updated = await api.reorderCategories(copy);
    setCategories(Array.isArray(updated) ? updated : copy);
  };

  const handleAddUniversity = async (e, forcedRegion = '') => {
    e.preventDefault();
    if (!newUniName.trim()) return;
    const targetRegion = forcedRegion || newUniRegion || activeRegionCard;
    const updated = await api.addUniversity({
      name: newUniName.trim(),
      short_name: newUniShort.trim(),
      region: targetRegion,
    });
    setUniversities(Array.isArray(updated) ? updated.filter(Boolean) : []);
    setNewUniName('');
    setNewUniShort('');
    toast({ title: `«${newUniName.trim()}» (${targetRegion}) ro‘yxatga qo‘shildi!` });
  };

  const handleConfirmApproveCustomUni = async (e) => {
    e.preventDefault();
    if (!approvingCustomUni || !customApproveName.trim()) return;
    setSavingCustomUni(true);
    try {
      const finalOfficialName = customApproveName.trim();
      const updatedUnis = await api.addUniversity({
        name: finalOfficialName,
        short_name: customApproveShort.trim(),
        region: customApproveRegion,
      });
      setUniversities(Array.isArray(updatedUnis) ? updatedUnis.filter(Boolean) : []);

      const affectedStudents = approvingCustomUni.students || [];
      for (const stu of affectedStudents) {
        await api.saveProfile(stu.id, {
          university: finalOfficialName,
          ...(customApproveRegion ? { region: customApproveRegion } : {}),
        });
      }

      await reload?.();
      await loadAll();
      setApprovingCustomUni(null);
      toast({
        title: `«${finalOfficialName}» bazaga qo‘shildi!`,
        description: `${affectedStudents.length} nafar talabaning profiliga avtomatik bog‘landi.`,
      });
    } finally {
      setSavingCustomUni(false);
    }
  };

  const toggleNewAdminPerm = (permId) => {
    setNewAdminPerms((prev) =>
      prev.includes(permId)
        ? prev.length > 1
          ? prev.filter((p) => p !== permId)
          : prev
        : [...prev, permId]
    );
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!session.isSuper) return;
    if (!newAdminName.trim() || !newAdminLogin.trim() || !newAdminPass.trim()) return;
    const res = await api.createAdmin({
      name: newAdminName,
      login: newAdminLogin,
      password: newAdminPass,
      permissions: newAdminPerms,
    });
    if (res?.error) {
      toast({ title: res.error, variant: 'destructive' });
      return;
    }
    setAdmins(await api.listAdmins());
    setNewAdminName('');
    setNewAdminLogin('');
    setNewAdminPass('');
    setNewAdminPerms(['stats', 'students']);
    toast({ title: 'Yangi admin va uning huquqlari saqlandi!' });
  };

  const handleToggleExistingAdminPerm = async (adm, permId) => {
    if (!session.isSuper || adm.isSuper) return;
    const cur = Array.isArray(adm.permissions) ? adm.permissions : ['stats', 'students'];
    const next = cur.includes(permId)
      ? cur.length > 1
        ? cur.filter((p) => p !== permId)
        : cur
      : [...cur, permId];
    if (api.updateAdminPermissions) {
      await api.updateAdminPermissions(adm.login, next);
    }
    setAdmins(await api.listAdmins());
    toast({ title: `${adm.name} ruxsatlari yangilandi` });
  };

  const selectedBrand = brands.find((b) => b.id === selectedBrandId);
  const verifiedCount = profiles.filter((p) => p.status === 'verified').length;
  const pendingCount = profiles.filter((p) => p.status === 'pending').length;

  const selectedStudentDeals = selectedStudent
    ? allRedemptions.filter((r) => r.student_name === selectedStudent.name)
    : [];

  const openStudentModal = (person) => {
    setSelectedStudent(person);
    setShowRejectInputInModal(false);
    setReason(person.rejection_reason || '');
  };

  return (
    <div className="min-h-screen bg-[#F5F8FF] pb-16">
      {/* MOBIL DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-[#08123A]/45 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative z-10 flex w-72 flex-col justify-between bg-white p-4 shadow-2xl">
            <div>
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3">
                <Logo size="sm" />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="space-y-1">
                {allowedSections.map((item) => {
                  const Icon = item.icon;
                  const active = section === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSection(item.id);
                        setDrawerOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13px] font-bold transition-all',
                        active
                          ? 'bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-2.5 text-[12.5px] font-bold text-rose-600"
            >
              <LogOut className="h-4 w-4" />
              Chiqish
            </button>
          </aside>
        </div>
      )}

      {/* YUQORI LIQUID GLASS HEADER & NAVIGATSIYA */}
      <header className="sticky top-0 z-30 border-b border-white/80 bg-white/80 px-4 py-3 shadow-[0_14px_34px_-22px_rgba(0,45,150,0.28)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-[#08123A] md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Logo size="sm" />
            <span className="hidden rounded-full bg-[#002D96]/10 px-3 py-1 text-[11px] font-extrabold text-[#002D96] sm:inline-block">
              {session.isSuper ? '👑 Super Admin' : '🛡️ Moderator'} · {session.name}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/80 px-3.5 py-1.5 text-[12px] font-bold text-rose-600 transition-colors hover:bg-rose-100"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Chiqish</span>
          </button>
        </div>

        {/* Liquid Glass yuqori menyu */}
        <div className="mx-auto mt-3 hidden max-w-6xl md:block">
          <div className="flex items-center gap-1.5 rounded-2xl border border-white/90 bg-white/75 p-1.5 shadow-[0_10px_28px_-16px_rgba(0,45,150,0.3)] backdrop-blur-2xl">
            {allowedSections.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[12.5px] font-extrabold transition-all',
                    active
                      ? 'bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white shadow-[0_10px_22px_-12px_rgba(0,45,150,0.9)]'
                      : 'text-slate-600 hover:bg-[#002D96]/[0.05] hover:text-[#002D96]'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.id === 'students' && pendingCount > 0 && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-extrabold',
                        active ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'
                      )}
                    >
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5">
        {/* 1. STATISTIKA */}
        {section === 'stats' && (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/80 bg-white/85 p-5 backdrop-blur-xl">
              <p className="text-[11px] font-bold uppercase text-slate-400">
                Jami foydalanuvchilar
              </p>
              <p className="mt-1.5 text-[28px] font-black text-[#08123A]">{profiles.length}</p>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/85 p-5 backdrop-blur-xl">
              <p className="text-[11px] font-bold uppercase text-emerald-600">
                Tasdiqlangan talaba
              </p>
              <p className="mt-1.5 text-[28px] font-black text-emerald-600">{verifiedCount}</p>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/85 p-5 backdrop-blur-xl">
              <p className="text-[11px] font-bold uppercase text-amber-600">
                Kutilayotgan ariza
              </p>
              <p className="mt-1.5 text-[28px] font-black text-amber-600">{pendingCount}</p>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/85 p-5 backdrop-blur-xl">
              <p className="text-[11px] font-bold uppercase text-slate-400">Hamkor brendlar</p>
              <p className="mt-1.5 text-[28px] font-black text-[#002D96]">{brands.length}</p>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/85 p-5 backdrop-blur-xl">
              <p className="text-[11px] font-bold uppercase text-slate-400">Faol chegirmalar</p>
              <p className="mt-1.5 text-[28px] font-black text-[#1D6FF2]">{allOffersCount}</p>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/85 p-5 backdrop-blur-xl">
              <p className="text-[11px] font-bold uppercase text-slate-400">Universitetlar</p>
              <p className="mt-1.5 text-[28px] font-black text-[#08123A]">{universities.length}</p>
            </div>
          </div>
        )}

        {/* 2. TALABALAR */}
        {section === 'students' && (
          <div className="space-y-3">
            <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-white/80 bg-white/80 p-1.5 backdrop-blur-xl">
              {STUDENT_TABS.map((item) => {
                const count =
                  item.id === 'all'
                    ? profiles.length
                    : profiles.filter((p) => p.status === item.id).length;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStudentTab(item.id)}
                    className={cn(
                      'flex-1 shrink-0 rounded-xl px-3.5 py-2 text-[12px] font-bold transition-all',
                      studentTab === item.id
                        ? 'bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#002D96]'
                    )}
                  >
                    {item.label}
                    <span className="ml-1.5 opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>

            {studentTab === 'all' ? (
              <div className="grid grid-cols-1 gap-2 rounded-2xl border border-white/80 bg-white/85 p-3 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-5">
                <div className="relative lg:col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Ism, ID, tel yoki email bo‘yicha qidirish..."
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[12px] font-semibold outline-none focus:border-[#1D6FF2]"
                  />
                </div>

                <select
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-[12px] font-semibold text-[#08123A] outline-none focus:border-[#1D6FF2]"
                >
                  <option value="">Barcha viloyatlar</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                <select
                  value={filterUniversity}
                  onChange={(e) => setFilterUniversity(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-[12px] font-semibold text-[#08123A] outline-none focus:border-[#1D6FF2]"
                >
                  <option value="">Barcha universitetlar</option>
                  {alphabetSortedUniversities.map((u, idx) => {
                    const name = typeof u === 'string' ? u : u?.name || '';
                    if (!name) return null;
                    return (
                      <option key={u?.id || `${name}-${idx}`} value={name}>
                        {name}
                      </option>
                    );
                  })}
                </select>

                <div className="flex gap-1.5">
                  <select
                    value={filterStatusInAll}
                    onChange={(e) => setFilterStatusInAll(e.target.value)}
                    className="h-9 flex-1 rounded-xl border border-slate-200 bg-white px-2.5 text-[12px] font-semibold text-[#08123A] outline-none focus:border-[#1D6FF2]"
                  >
                    <option value="all">Barcha statuslar</option>
                    <option value="verified">Tasdiqlangan</option>
                    <option value="pending">Kutilmoqda</option>
                    <option value="rejected">Rad etilgan</option>
                    <option value="unverified">Hujjatsiz</option>
                  </select>
                  {(studentSearch ||
                    filterRegion ||
                    filterUniversity ||
                    filterStatusInAll !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setStudentSearch('');
                        setFilterRegion('');
                        setFilterUniversity('');
                        setFilterStatusInAll('all');
                      }}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Ism, familiya, ID, telefon yoki universitet bo‘yicha qidiring..."
                  className="h-10 w-full rounded-2xl border border-white/80 bg-white/90 pl-10 pr-4 text-[12.5px] font-semibold text-[#08123A] outline-none backdrop-blur-xl focus:border-[#1D6FF2]"
                />
              </div>
            )}

            {loading ? (
              <div className="grid place-items-center rounded-[24px] bg-white/60 py-14">
                <Loader2 className="h-5 w-5 animate-spin text-[#1D6FF2]" />
              </div>
            ) : (() => {
              const q = studentSearch.trim().toLowerCase().replace(/^#/, '');
              const baseList =
                studentTab === 'all'
                  ? profiles.filter(
                      (p) => filterStatusInAll === 'all' || p.status === filterStatusInAll
                    )
                  : profiles.filter((p) => p.status === studentTab);

              const filteredStudents = baseList.filter((p) => {
                const matchQuery =
                  !q ||
                  (p.name || '').toLowerCase().includes(q) ||
                  String(p.student_id || '').includes(q) ||
                  (p.phone || '').toLowerCase().includes(q) ||
                  (p.email || '').toLowerCase().includes(q) ||
                  (p.university || '').toLowerCase().includes(q);
                if (studentTab !== 'all') return matchQuery;
                const matchRegion = !filterRegion || p.region === filterRegion;
                const matchUni = !filterUniversity || p.university === filterUniversity;
                return matchQuery && matchRegion && matchUni;
              });

              if (filteredStudents.length === 0) {
                return (
                  <div className="rounded-[24px] border border-dashed border-white/80 bg-white/50 py-12 text-center">
                    <FileText className="mx-auto h-5 w-5 text-slate-400" />
                    <p className="mt-2 text-[12.5px] font-semibold text-[#08123A]">
                      Talabalar topilmadi
                    </p>
                  </div>
                );
              }

              return (
                <div className="overflow-hidden rounded-[22px] border border-white/80 bg-white/90 shadow-xs backdrop-blur-xl">
                  <ul className="divide-y divide-slate-100">
                    {filteredStudents.map((person) => {
                      const isCustomUni = (person.university || '')
                        .toLowerCase()
                        .startsWith('boshqa');
                      return (
                        <li
                          key={person.id}
                          onClick={() => openStudentModal(person)}
                          className="group flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 transition-colors hover:bg-[#1D6FF2]/[0.04]"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#002D96]/10 text-[11.5px] font-extrabold text-[#002D96]">
                              {(person.name || 'T').slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="truncate text-[13px] font-extrabold text-[#08123A] group-hover:text-[#002D96]">
                                  {person.name}
                                </p>
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#002D96]">
                                  #{person.student_id}
                                </span>
                                {person.document_url && (
                                  <span className="inline-flex items-center gap-0.5 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-[#1D6FF2]">
                                    <FileText className="h-2.5 w-2.5" />
                                    Fayl
                                  </span>
                                )}
                              </div>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                                <span
                                  className={cn(
                                    'max-w-[260px] truncate',
                                    isCustomUni && 'font-bold text-indigo-600'
                                  )}
                                >
                                  {person.university || 'OTM kiritilmagan'}
                                </span>
                                {person.region && (
                                  <span className="text-slate-400">· {person.region}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <VerificationPill status={person.status} />
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#002D96]" />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })()}
          </div>
        )}

        {/* =========================================================
            3. BRENDLAR VA AKSIYALAR (PASTGA QARAB ALIFBO TARTIBIDA A-Z VA ICHIGA KIRGANDA AKSIYALAR)
        ========================================================= */}
        {/* 3. BRENDLAR VA AKSIYALAR */}
        {section === 'deals' && (
          <div className="space-y-4">
            {!selectedBrand ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      placeholder="Brend nomini qidiring..."
                      className="h-10 w-full rounded-2xl border border-white/80 bg-white/90 pl-10 pr-4 text-[12.5px] font-semibold outline-none focus:border-[#1D6FF2]"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      setEditingBrand(null);
                      setShowBrandForm((v) => !v);
                    }}
                    className="h-10 rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] px-5 text-[12.5px] font-bold text-white"
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Yangi brend qo‘shish
                  </Button>
                </div>

                {showBrandForm && (
                  <BrandForm
                    initialBrand={null}
                    onCancel={() => setShowBrandForm(false)}
                    onSaved={(saved) => {
                      setShowBrandForm(false);
                      loadAll();
                      setSelectedBrandId(saved.id);
                      toast({ title: 'Yangi brend qo‘shildi! Endi unga chegirmalar qo‘shing.' });
                    }}
                  />
                )}

                <div className="overflow-hidden rounded-[22px] border border-white/80 bg-white/90 shadow-xs backdrop-blur-xl">
                  <div className="border-b border-slate-100 px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Hamkor brendlar alifbo tartibida (A–Z) ({alphabetSortedBrands.length})
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {alphabetSortedBrands.map((b) => (
                      <li
                        key={b.id}
                        onClick={() => {
                          setSelectedBrandId(b.id);
                          setEditingBrand(null);
                          setShowBrandForm(false);
                        }}
                        className="group flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[#1D6FF2]/[0.04]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-100 bg-white p-1 text-[12px] font-black text-[#08123A] shadow-2xs">
                            {b.logo_url ? (
                              <img
                                src={b.logo_url}
                                alt={b.name}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              b.monogram
                            )}
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-[14px] font-extrabold text-[#08123A] group-hover:text-[#002D96]">
                                {b.name}
                              </p>
                              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10.5px] font-extrabold text-amber-800">
                                ⭐ {b.tagline?.uz || b.discount}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500">
                              Kategoriyalar: {(b.categories || [b.category]).join(', ')} ·{' '}
                              {b.has_map ? '📍 Xarita ulangan' : 'Xaritasiz'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11.5px] font-bold text-[#1D6FF2] group-hover:underline">
                            Chegirmalarni boshqarish
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#002D96]" />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBrandId(null);
                      setEditingBrand(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white px-4 py-2 text-[12.5px] font-extrabold text-[#002D96] shadow-2xs hover:bg-slate-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Barcha brendlar ro‘yxatiga qaytish
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingBrand(editingBrand ? null : selectedBrand)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-bold text-[#002D96]"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      {editingBrand
                        ? 'Tahrirlashni yopish'
                        : 'Brend / Xarita / Kategoriyani tahrirlash'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await api.deleteBrand(selectedBrand.id);
                        setSelectedBrandId(null);
                        await loadAll();
                        toast({ title: `${selectedBrand.name} o‘chirildi` });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-2 text-[12px] font-bold text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Brendni o‘chirish
                    </button>
                  </div>
                </div>

                {editingBrand && (
                  <BrandForm
                    initialBrand={editingBrand}
                    onCancel={() => setEditingBrand(null)}
                    onSaved={() => {
                      setEditingBrand(null);
                      loadAll();
                      toast({ title: 'Brend ma’lumotlari yangilandi!' });
                    }}
                  />
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-white/80 bg-white/90 p-5 backdrop-blur-xl">
                    <div className="mb-3">
                      <p className="text-[14px] font-extrabold text-[#08123A]">
                        {selectedBrand.name} chegirmalari ({offers.length})
                      </p>
                      <p className="text-[11.5px] text-slate-500">
                        Agar bir nechta chegirma bo‘lsa, «⭐ Asosiy yorliq» tugmasini bosib eng
                        zo‘rini tanlang — brend yorlig‘i avtomatik o‘sha nomni oladi!
                      </p>
                    </div>

                    {offers.length ? (
                      <ul className="space-y-2.5">
                        {offers.map((offer) => {
                          const isBestOffer =
                            offer.is_best ||
                            selectedBrand.best_offer_id === offer.id ||
                            selectedBrand.tagline?.uz === (offer.title_uz || offer.title?.uz);

                          return (
                            <li
                              key={offer.id}
                              className={cn(
                                'rounded-2xl border p-3.5 transition-all',
                                isBestOffer
                                  ? 'border-amber-400 bg-amber-50/40'
                                  : 'border-slate-100 bg-white'
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-[13.5px] font-extrabold text-[#08123A]">
                                    {localizedTitle(offer, lang)}
                                  </p>
                                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10.5px] font-semibold text-slate-500">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
                                      {offer.redemption === 'app' ? (
                                        <Smartphone className="h-2.5 w-2.5" />
                                      ) : (
                                        <QrCode className="h-2.5 w-2.5" />
                                      )}
                                      {offer.redemption === 'app'
                                        ? 'Online (Promo-kod)'
                                        : 'Filialda (QR-kod)'}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await api.setBestOfferForBrand(
                                          selectedBrand.id,
                                          offer.id,
                                          offer.title_uz || offer.title?.uz
                                        );
                                        const freshOffers = await api.listOffers(selectedBrand.id);
                                        setOffers(freshOffers);
                                        await loadAll();
                                        toast({
                                          title: 'Eng zo‘r chegirma sifatida belgilandi!',
                                          description:
                                            'Brendning asosiy yorlig‘i va slaydi yangilandi.',
                                        });
                                      }}
                                      className={cn(
                                        'rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold transition-colors',
                                        isBestOffer
                                          ? 'bg-amber-400 text-[#08123A]'
                                          : 'bg-slate-100 text-slate-600 hover:bg-amber-100'
                                      )}
                                    >
                                      {isBestOffer
                                        ? '⭐ Eng zo‘ri (Asosiy yorliq)'
                                        : '☆ Eng zo‘ri deb belgilash'}
                                    </button>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    const ok = await api.deleteOffer(offer.id);
                                    if (ok) {
                                      setOffers((list) => list.filter((o) => o.id !== offer.id));
                                      setAllOffersCount((c) => Math.max(0, c - 1));
                                      toast({ title: 'Chegirma o‘chirildi' });
                                    }
                                  }}
                                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-[12px] font-semibold text-slate-400">
                        Bu brendda hozircha chegirmalar yo‘q. O‘ng tomondan yangi chegirma
                        qo‘shing.
                      </p>
                    )}
                  </div>

                  <OfferForm
                    brand={selectedBrand}
                    onSaved={async (created) => {
                      const freshOffers = await api.listOffers(selectedBrand.id);
                      setOffers(freshOffers.length ? freshOffers : [...offers, created]);
                      setAllOffersCount((c) => c + 1);
                      await loadAll();
                      toast({ title: 'Yangi chegirma qo‘shildi!', description: created.title_uz });
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. KATEGORIYALAR */}
        {section === 'categories' && (
          <div className="grid gap-4 md:grid-cols-2">
            <form
              onSubmit={handleSaveCategory}
              className="rounded-[24px] border border-white/80 bg-white/85 p-5 backdrop-blur-xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#002D96]" />
                  <h3 className="text-[14px] font-extrabold text-[#08123A]">
                    {editingCatId ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya qo‘shish'}
                  </h3>
                </div>
                {editingCatId && (
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="text-[11.5px] font-bold text-slate-400"
                  >
                    Bekor qilish
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <input
                  required
                  value={catLabelUz}
                  onChange={(e) => setCatLabelUz(e.target.value)}
                  placeholder="Nomi (O‘zbekcha) *"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-semibold outline-none focus:border-[#1D6FF2]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={catLabelRu}
                    onChange={(e) => setCatLabelRu(e.target.value)}
                    placeholder="Ruscha (Еда)"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold outline-none"
                  />
                  <input
                    value={catLabelEn}
                    onChange={(e) => setCatLabelEn(e.target.value)}
                    placeholder="Inglizcha (Food)"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold outline-none"
                  />
                </div>
                <div className="grid grid-cols-8 gap-1.5">
                  {ICON_OPTIONS.map((iconName) => {
                    const IconComp = CATEGORY_ICON_MAP?.[iconName] || Tag;
                    const active = catIcon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setCatIcon(iconName)}
                        className={cn(
                          'grid h-9 w-9 place-items-center rounded-xl border transition-all',
                          active
                            ? 'border-[#1D6FF2] bg-[#002D96] text-white'
                            : 'border-slate-200 bg-white text-slate-600'
                        )}
                      >
                        <IconComp className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
                <Button
                  type="submit"
                  className="h-10 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[12.5px] font-bold text-white"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  {editingCatId ? 'Saqlash' : 'Qo‘shish'}
                </Button>
              </div>
            </form>

            <div className="rounded-[24px] border border-white/80 bg-white/85 p-5 backdrop-blur-xl">
              <h3 className="mb-3 text-[14px] font-extrabold text-[#08123A]">
                Mavjud kategoriyalar ({categories.length})
              </h3>
              <ul className="space-y-2">
                {categories.map((cat, idx) => {
                  const IconComp = CATEGORY_ICON_MAP?.[cat.icon] || Tag;
                  return (
                    <li
                      key={cat.id || idx}
                      className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white px-3.5 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#002D96]/10 text-[#002D96]">
                          <IconComp className="h-4 w-4" />
                        </span>
                        <p className="truncate text-[13px] font-bold text-[#08123A]">
                          {cat.label_uz}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(idx, -1)}
                          disabled={idx === 0}
                          className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-600 disabled:opacity-30"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(idx, 1)}
                          disabled={idx === categories.length - 1}
                          className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-600 disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCatId(cat.id);
                            setCatIdInput(cat.id);
                            setCatLabelUz(cat.label_uz || '');
                            setCatLabelRu(cat.label_ru || '');
                            setCatLabelEn(cat.label_en || '');
                            setCatIcon(cat.icon || 'Utensils');
                          }}
                          className="grid h-7 w-7 place-items-center rounded-full bg-blue-50 text-[#002D96]"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        {cat.id !== 'all' && (
                          <button
                            type="button"
                            onClick={async () => {
                              const next = await api.deleteCategory(cat.id);
                              setCategories(Array.isArray(next) ? next : []);
                              toast({ title: 'Kategoriya o‘chirildi' });
                            }}
                            className="grid h-7 w-7 place-items-center rounded-full bg-rose-50 text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {/* 5. UNIVERSITETLAR */}
        {section === 'universities' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-white/80 bg-white/85 p-1.5 backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => setUniViewMode('all')}
                  className={cn(
                    'rounded-xl px-3.5 py-2 text-[12px] font-extrabold transition-all',
                    uniViewMode === 'all'
                      ? 'bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white'
                      : 'text-slate-600'
                  )}
                >
                  Hamma universitetlar (A–Z) ({universities.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUniViewMode('regions')}
                  className={cn(
                    'rounded-xl px-3.5 py-2 text-[12px] font-extrabold transition-all',
                    uniViewMode === 'regions'
                      ? 'bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white'
                      : 'text-slate-600'
                  )}
                >
                  Hamma viloyatlar ({REGIONS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUniViewMode('custom')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-extrabold transition-all',
                    uniViewMode === 'custom'
                      ? 'bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white'
                      : 'text-indigo-600 hover:bg-indigo-50'
                  )}
                >
                  <span>Talaba o‘zi yozgan universitetlar</span>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700">
                    {studentWrittenUniversities.length}
                  </span>
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={uniSearchQuery}
                  onChange={(e) => setUniSearchQuery(e.target.value)}
                  placeholder="Universitet qidirish..."
                  className="h-10 w-full rounded-xl border border-white/80 bg-white/90 pl-9 pr-3 text-[12.5px] font-semibold outline-none focus:border-[#1D6FF2]"
                />
              </div>
            </div>

            {uniViewMode === 'all' && (
              <div className="space-y-4">
                <form
                  onSubmit={(e) => handleAddUniversity(e, '')}
                  className="grid grid-cols-1 gap-2.5 rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-xs backdrop-blur-xl sm:grid-cols-4"
                >
                  <input
                    required
                    value={newUniName}
                    onChange={(e) => setNewUniName(e.target.value)}
                    placeholder="Yangi universitet to‘liq nomi *"
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12.5px] font-semibold outline-none focus:border-[#1D6FF2] sm:col-span-2"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={newUniShort}
                      onChange={(e) => setNewUniShort(e.target.value)}
                      placeholder="Qisqa (TATU)"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12.5px] font-semibold outline-none"
                    />
                    <select
                      value={newUniRegion}
                      onChange={(e) => setNewUniRegion(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 text-[12px] font-semibold text-[#08123A] outline-none"
                    >
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="submit"
                    className="h-10 rounded-xl bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[12.5px] font-bold text-white"
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Tez qo‘shish
                  </Button>
                </form>

                <div className="rounded-[24px] border border-white/80 bg-white/85 p-5 backdrop-blur-xl">
                  <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {alphabetSortedUniversities.map((uni, idx) => {
                      const uniName = typeof uni === 'string' ? uni : uni?.name || '';
                      const uniShort = typeof uni === 'object' ? uni?.short_name : '';
                      const uniRegion = typeof uni === 'object' ? uni?.region : '';
                      if (!uniName) return null;
                      return (
                        <li
                          key={uni?.id || `${uniName}-${idx}`}
                          className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white px-3.5 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[12.5px] font-bold text-[#08123A]">
                              {uniShort ? `${uniShort} — ${uniName}` : uniName}
                            </p>
                            {uniRegion && (
                              <p className="mt-0.5 text-[10.5px] font-semibold text-[#1D6FF2]">
                                📍 {uniRegion}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              const next = await api.deleteUniversity(uniName);
                              setUniversities(Array.isArray(next) ? next.filter(Boolean) : []);
                              toast({ title: 'Universitet o‘chirildi' });
                            }}
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}

            {uniViewMode === 'regions' && (
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-[24px] border border-white/80 bg-white/85 p-4 backdrop-blur-xl">
                  <div className="space-y-1.5">
                    {REGIONS.map((reg) => {
                      const norm = (r) =>
                        String(r || '')
                          .toLowerCase()
                          .replace(/viloyati|shahri|respublikasi/g, '')
                          .trim();
                      const count = universities.filter(
                        (u) =>
                          u &&
                          typeof u === 'object' &&
                          u.region &&
                          (u.region === reg || norm(u.region) === norm(reg))
                      ).length;
                      const active = activeRegionCard === reg;
                      return (
                        <button
                          key={reg}
                          type="button"
                          onClick={() => setActiveRegionCard(reg)}
                          className={cn(
                            'flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-[12.5px] font-bold transition-all',
                            active
                              ? 'bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white'
                              : 'bg-white text-slate-600 hover:bg-slate-50'
                          )}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{reg}</span>
                          </span>
                          <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10.5px] font-extrabold">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 lg:col-span-2">
                  <form
                    onSubmit={(e) => handleAddUniversity(e, activeRegionCard)}
                    className="rounded-[24px] border border-[#1D6FF2]/30 bg-white/95 p-4 shadow-xs backdrop-blur-xl"
                  >
                    <p className="mb-2.5 text-[13px] font-extrabold text-[#002D96]">
                      ➕ {activeRegionCard}ga tezkor universitet qo‘shish
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        required
                        value={newUniName}
                        onChange={(e) => setNewUniName(e.target.value)}
                        placeholder={`${activeRegionCard}dagi universitet to‘liq nomi *`}
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-semibold outline-none"
                      />
                      <input
                        value={newUniShort}
                        onChange={(e) => setNewUniShort(e.target.value)}
                        placeholder="Qisqa nomi"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-semibold outline-none sm:w-36"
                      />
                      <Button
                        type="submit"
                        className="h-10 shrink-0 rounded-xl bg-gradient-to-r from-[#002D96] to-[#1D6FF2] px-5 text-[12.5px] font-bold text-white"
                      >
                        Qo‘shish
                      </Button>
                    </div>
                  </form>

                  <div className="rounded-[24px] border border-white/80 bg-white/85 p-5 backdrop-blur-xl">
                    <ul className="space-y-2">
                      {regionFilteredUniversities.map((uni, idx) => {
                        const uniName = typeof uni === 'string' ? uni : uni?.name || '';
                        const uniShort = typeof uni === 'object' ? uni?.short_name : '';
                        return (
                          <li
                            key={uni?.id || `${uniName}-${idx}`}
                            className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white px-3.5 py-2.5"
                          >
                            <p className="truncate text-[13px] font-bold text-[#08123A]">
                              {uniShort ? `${uniShort} — ${uniName}` : uniName}
                            </p>
                            <button
                              type="button"
                              onClick={async () => {
                                const next = await api.deleteUniversity(uniName);
                                setUniversities(Array.isArray(next) ? next.filter(Boolean) : []);
                                toast({ title: 'Universitet o‘chirildi' });
                              }}
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {uniViewMode === 'custom' && (
              <div className="rounded-[24px] border border-white/80 bg-white/90 p-5 backdrop-blur-xl">
                {studentWrittenUniversities.length === 0 ? (
                  <p className="py-8 text-center text-[13px] font-bold text-slate-400">
                    Hozircha talabalar qo‘lda kiritgan yangi universitetlar yo‘q
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {studentWrittenUniversities.map((item, idx) => (
                      <li
                        key={idx}
                        onClick={() => {
                          setApprovingCustomUni(item);
                          setCustomApproveName(item.cleanName);
                          setCustomApproveShort('');
                          setCustomApproveRegion(item.suggestedRegion || REGIONS[0]);
                        }}
                        className="flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 px-4 py-3 hover:bg-white"
                      >
                        <div>
                          <p className="text-[13.5px] font-extrabold text-[#08123A]">
                            {item.cleanName}
                          </p>
                          <p className="text-[11.5px] text-slate-500">
                            Talabalar ({item.students.length}):{' '}
                            {item.students.map((s) => s.name).join(', ')}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#002D96] px-3.5 py-1.5 text-[11.5px] font-bold text-white">
                          Tasdiqlash va qo‘shish
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* 6. ADMINLAR VA HUQUQLAR */}
        {section === 'admins' && session.isSuper && (
          <div className="grid gap-4 lg:grid-cols-2">
            <form
              onSubmit={handleAddAdmin}
              className="space-y-3.5 rounded-[26px] border border-white/80 bg-white/90 p-5 backdrop-blur-xl"
            >
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[#002D96]" />
                <h3 className="text-[15px] font-extrabold text-[#08123A]">
                  Yangi admin qo‘shish va ruxsatlarni belgilash
                </h3>
              </div>

              <div className="space-y-2.5">
                <input
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Admin ismi va familiyasi"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12.5px] font-semibold outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    required
                    value={newAdminLogin}
                    onChange={(e) => setNewAdminLogin(e.target.value)}
                    placeholder="Login"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12.5px] font-semibold outline-none"
                  />
                  <input
                    required
                    type="password"
                    value={newAdminPass}
                    onChange={(e) => setNewAdminPass(e.target.value)}
                    placeholder="Parol"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12.5px] font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                {(ADMIN_PERMISSION_LIST || []).map((perm) => {
                  const checked = newAdminPerms.includes(perm.id);
                  return (
                    <button
                      key={perm.id}
                      type="button"
                      onClick={() => toggleNewAdminPerm(perm.id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2 text-left text-[12px] font-bold',
                        checked
                          ? 'border-[#1D6FF2] bg-[#1D6FF2]/10 text-[#002D96]'
                          : 'border-slate-200 bg-white text-slate-500'
                      )}
                    >
                      <span
                        className={cn(
                          'grid h-4 w-4 place-items-center rounded border',
                          checked ? 'border-[#1D6FF2] bg-[#1D6FF2] text-white' : 'border-slate-300'
                        )}
                      >
                        {checked && <Check className="h-3 w-3" />}
                      </span>
                      <span>{perm.label}</span>
                    </button>
                  );
                })}
              </div>

              <Button
                type="submit"
                className="h-10 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[12.5px] font-bold text-white"
              >
                Admin yaratish
              </Button>
            </form>

            <div className="space-y-3 rounded-[26px] border border-white/80 bg-white/90 p-5 backdrop-blur-xl">
              <h3 className="text-[15px] font-extrabold text-[#08123A]">
                Mavjud adminlar ({admins.length})
              </h3>
              <ul className="space-y-3">
                {admins.map((adm) => (
                  <li
                    key={adm.id || adm.login}
                    className="rounded-2xl border border-slate-100 bg-white p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[13.5px] font-extrabold text-[#08123A]">{adm.name}</p>
                        <p className="font-mono text-[11px] text-slate-500">Login: {adm.login}</p>
                      </div>
                      {!adm.isSuper && adm.id !== session.id && (
                        <button
                          type="button"
                          onClick={async () => {
                            await api.deleteAdmin(adm.id);
                            setAdmins(await api.listAdmins());
                            toast({ title: 'Admin o‘chirildi' });
                          }}
                          className="grid h-8 w-8 place-items-center rounded-full bg-rose-50 text-rose-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {!adm.isSuper && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2.5">
                        {(ADMIN_PERMISSION_LIST || []).map((perm) => {
                          const hasPerm = (adm.permissions || []).includes(perm.id);
                          return (
                            <button
                              key={perm.id}
                              type="button"
                              onClick={() => handleToggleExistingAdminPerm(adm, perm.id)}
                              className={cn(
                                'rounded-full border px-2.5 py-1 text-[10.5px] font-bold',
                                hasPerm
                                  ? 'border-[#1D6FF2] bg-[#002D96] text-white'
                                  : 'border-slate-200 bg-slate-50 text-slate-400'
                              )}
                            >
                              {hasPerm ? '✓ ' : '+ '}
                              {perm.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* TALABA YOZGAN UNIVERSITETNI TASDIQLASH MODALI */}
      {approvingCustomUni && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#08123A]/55 p-4 backdrop-blur-xs"
          onClick={() => setApprovingCustomUni(null)}
        >
          <form
            onSubmit={handleConfirmApproveCustomUni}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-3.5 rounded-[28px] bg-white p-6 shadow-2xl"
          >
            <h3 className="text-[16px] font-extrabold text-[#08123A]">
              Universitetni bazaga qo‘shish
            </h3>
            <input
              required
              value={customApproveName}
              onChange={(e) => setCustomApproveName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] font-bold outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={customApproveShort}
                onChange={(e) => setCustomApproveShort(e.target.value)}
                placeholder="Qisqa nomi"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[12.5px] font-semibold outline-none"
              />
              <select
                value={customApproveRegion}
                onChange={(e) => setCustomApproveRegion(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[12.5px] font-semibold outline-none"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setApprovingCustomUni(null)}
                className="h-10 flex-1 rounded-full"
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={savingCustomUni}
                className="h-10 flex-1 rounded-full bg-[#002D96] text-white"
              >
                Tasdiqlash
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TALABA DETAL MODALI */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#08123A]/55 p-4 backdrop-blur-xs"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[17px] font-extrabold text-[#08123A]">
                    {selectedStudent.name}
                  </p>
                  <VerificationPill status={selectedStudent.status} />
                </div>
                <p className="mt-0.5 font-mono text-[11.5px] font-bold text-[#1D6FF2]">
                  Talaba ID: #{selectedStudent.student_id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3.5 grid grid-cols-1 gap-2 text-[12px] sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <span className="block text-[10.5px] font-bold uppercase text-slate-400">
                  Aloqa
                </span>
                <span className="font-bold text-[#08123A]">
                  {selectedStudent.phone || selectedStudent.email || '—'}
                </span>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <span className="block text-[10.5px] font-bold uppercase text-slate-400">
                  Viloyat
                </span>
                <span className="font-bold text-[#08123A]">{selectedStudent.region || '—'}</span>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 sm:col-span-2">
                <span className="block text-[10.5px] font-bold uppercase text-slate-400">
                  Ta’lim muassasasi
                </span>
                <span className="font-bold text-[#08123A]">
                  {selectedStudent.university || '—'}
                </span>
              </div>
              {selectedStudent.rejection_reason && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 sm:col-span-2">
                  <span className="font-bold">Rad etish izohi: </span>
                  <span>{selectedStudent.rejection_reason}</span>
                </div>
              )}
            </div>

            {selectedStudent.document_url ? (
              <button
                type="button"
                onClick={() => setPreviewDocPerson(selectedStudent)}
                className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#1D6FF2]/40 bg-[#1D6FF2]/10 py-2.5 text-[12.5px] font-extrabold text-[#002D96]"
              >
                <Eye className="h-4 w-4" />
                Hujjatni brauzerda ko‘rish ({selectedStudent.document_name || 'Fayl'})
              </button>
            ) : (
              <div className="mt-3.5 rounded-2xl border border-dashed border-slate-200 py-3 text-center text-[12px] font-semibold text-slate-400">
                Talaba hali tasdiqlovchi hujjat yuklamagan (Hujjatsiz)
              </div>
            )}

            {selectedStudent.status !== 'unverified' && (
              <div className="mt-4 border-t border-slate-100 pt-3.5">
                <div className="flex flex-wrap gap-2">
                  {selectedStudent.status !== 'verified' && (
                    <Button
                      onClick={() => updateStudentStatus(selectedStudent, 'verified')}
                      disabled={busyId === selectedStudent.id}
                      className="h-10 flex-1 rounded-full bg-emerald-500 text-[12.5px] font-bold text-white"
                    >
                      <Check className="mr-1.5 h-4 w-4" />
                      {selectedStudent.status === 'rejected'
                        ? 'Qayta tasdiqlash (Approve)'
                        : 'Tasdiqlash (Approve)'}
                    </Button>
                  )}

                  {selectedStudent.status !== 'rejected' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRejectInputInModal((v) => !v)}
                      disabled={busyId === selectedStudent.id}
                      className="h-10 flex-1 rounded-full border-rose-200 text-[12.5px] font-bold text-rose-600"
                    >
                      <X className="mr-1.5 h-4 w-4" />
                      Rad etish
                    </Button>
                  )}
                </div>

                {showRejectInputInModal && (
                  <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5">
                    <input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Rad etish sababini yozing *"
                      className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-[12.5px] font-semibold outline-none"
                    />
                    <div className="mt-2.5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateStudentStatus(selectedStudent, 'rejected', reason)}
                        className="flex-1 rounded-full bg-rose-600 py-2 text-[12px] font-bold text-white"
                      >
                        Izoh bilan rad etish
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRejectInputInModal(false)}
                        className="flex-1 rounded-full bg-white py-2 text-[12px] font-bold text-slate-600"
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 border-t border-slate-100 pt-3.5">
              <p className="mb-2 flex items-center gap-1.5 text-[12px] font-extrabold text-[#08123A]">
                <Ticket className="h-3.5 w-3.5 text-[#1D6FF2]" />
                Foydalanilgan aksiyalar ({selectedStudentDeals.length})
              </p>
              {selectedStudentDeals.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 py-3 text-center text-[11.5px] text-slate-400">
                  Hali chegirma ishlatmagan
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {selectedStudentDeals.map((deal) => (
                    <li
                      key={deal.id}
                      className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[12px]"
                    >
                      <div className="flex justify-between">
                        <span className="font-bold text-[#08123A]">{deal.brand_name}</span>
                        <span className="font-mono text-[11px] font-bold text-[#1D6FF2]">
                          {deal.code}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* IN-BROWSER PREVIEW MODALI */}
      {previewDocPerson && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#08123A]/75 p-4 backdrop-blur-xs"
          onClick={() => setPreviewDocPerson(null)}
        >
          <div
            className="flex h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <h3 className="text-[15px] font-extrabold text-[#08123A]">
                {previewDocPerson.name} — {previewDocPerson.document_name || 'Hujjat'}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewDocPerson.document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-[11.5px] font-bold text-[#002D96]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Yangi oynada
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDocPerson(null)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-900/95 p-4">
              {String(previewDocPerson.document_name || previewDocPerson.document_url)
                .toLowerCase()
                .includes('.pdf') ||
              String(previewDocPerson.document_url).startsWith('data:application/pdf') ? (
                <iframe
                  src={previewDocPerson.document_url}
                  title="Document PDF"
                  className="h-full w-full rounded-xl bg-white"
                />
              ) : (
                <img
                  src={previewDocPerson.document_url}
                  alt={previewDocPerson.name}
                  className="max-h-full max-w-full rounded-xl object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHIQISHNI TASDIQLASH MODALI */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08123A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[26px] bg-white p-5 shadow-2xl">
            <h3 className="text-[16px] font-extrabold text-[#08123A]">Tizimdan chiqish</h3>
            <p className="mt-1.5 text-[13px] text-slate-600">
              Haqiqatan ham tizimdan chiqmoqchimisiz?
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-full border border-slate-200 bg-white py-2.5 text-[12.5px] font-bold text-slate-600"
              >
                Yo‘q
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 rounded-full bg-rose-500 py-2.5 text-[12.5px] font-bold text-white"
              >
                Ha, chiqish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}