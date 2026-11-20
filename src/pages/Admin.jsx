import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Instagram,
  KeyRound,
  Layers,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Plus,
  QrCode,
  RotateCcw,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Smartphone,
  Store,
  Sun,
  Tag,
  Ticket,
  Trash2,
  Type,
  UserPlus,
  Users,
  X,
  Youtube,
} from 'lucide-react';
import BrandForm from '@/components/admin/BrandForm';
import OfferForm from '@/components/admin/OfferForm';
import VerificationPill from '@/components/VerificationPill';
import UniversitySelect from '@/components/UniversitySelect';
import RegionSelect from '@/components/RegionSelect';
import { CATEGORY_ICON_MAP } from '@/components/CategoryPills';
import Logo from '@/components/Logo';
import PageTopGradient from '@/components/PageTopGradient';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useLang } from '@/lib/LanguageContext';
import { useStudent } from '@/lib/StudentContext';
import { useTheme } from '@/lib/ThemeContext';
import { useScrollLock } from '@/lib/useScrollLock';
import {
  ADMIN_PERMISSION_LIST,
  api,
  COURSE_OPTIONS,
  DEFAULT_CATEGORIES,
  DEFAULT_SITE_SETTINGS,
  normalizeCourse,
  normalizeSiteSettings,
} from '@/services/api';
import { localizedTitle } from '@/lib/deal';
import { cn } from '@/lib/utils';
import { REGIONS } from '@/lib/formUtils';

const SIDEBAR_STORAGE_KEY = 'imtiyo_admin_sidebar_collapsed_v1';

const ALL_SECTIONS = [
  { id: 'stats', slug: 'statistika', label: 'Statistika', icon: BarChart3 },
  { id: 'students', slug: 'talabalar', label: 'Talabalar', icon: Users },
  { id: 'deals', slug: 'brendlar', label: 'Brend va e’lonlar', icon: Store },
  { id: 'categories', slug: 'kategoriyalar', label: 'Kategoriyalar', icon: Layers },
  { id: 'universities', slug: 'universitetlar', label: 'Universitetlar', icon: Building2 },
  { id: 'messages', slug: 'xabarlar', label: 'Xabarlar', icon: MessageSquare },
  { id: 'notifications', slug: 'bildirishnomalar', label: 'Bildirishnomalar', icon: Megaphone },
  { id: 'admins', slug: 'adminlar', label: 'Adminlar va Huquqlar', icon: KeyRound, superOnly: true },
  { id: 'settings', slug: 'sozlamalar', label: 'Sozlamalar', icon: Settings },
];

const STUDENT_TABS = [
  { id: 'pending', slug: 'kutilmoqda', label: 'Kutilmoqda' },
  { id: 'verified', slug: 'tasdiqlanganlar', label: 'Tasdiqlangan' },
  { id: 'rejected', slug: 'rad-etilganlar', label: 'Rad etilgan' },
  { id: 'unverified', slug: 'hujjatsiz', label: 'Hujjatsiz' },
  { id: 'all', slug: 'hammasi', label: 'Hamma talabalar' },
];

const UNI_TABS = [
  { id: 'all', slug: 'hammasi', label: 'Hamma universitetlar (A–Z)' },
  { id: 'regions', slug: 'viloyatlar', label: 'Hamma viloyatlar' },
  { id: 'custom', slug: 'talaba-yozgan', label: 'Talaba o‘zi yozgan universitetlar' },
];

const ICON_OPTIONS = Object.keys(CATEGORY_ICON_MAP || {});

function parseAdminPathname(pathname) {
  const raw = String(pathname || '/admin').replace(/\/+$/, '');
  const parts = raw.split('/').filter(Boolean); // ['admin', ...]
  const seg1 = (parts[1] || '').toLowerCase();
  const seg2 = parts[2] || '';
  const seg3 = (parts[3] || '').toLowerCase();

  if (!seg1 || seg1 === 'statistika' || seg1 === 'stats') {
    return {
      section: 'stats',
      studentTab: 'pending',
      hasExplicitStudentTab: false,
      selectedBrandId: null,
      showBrandForm: false,
      editBrandMode: false,
      uniViewMode: 'all',
      hasExplicitUniTab: false,
    };
  }

  if (seg1 === 'talabalar' || seg1 === 'students') {
    const matchedTab = STUDENT_TABS.find(
      (t) => t.slug === seg2.toLowerCase() || t.id === seg2.toLowerCase()
    );
    return {
      section: 'students',
      studentTab: matchedTab ? matchedTab.id : 'pending',
      hasExplicitStudentTab: Boolean(matchedTab),
      selectedBrandId: null,
      showBrandForm: false,
      editBrandMode: false,
      uniViewMode: 'all',
      hasExplicitUniTab: false,
    };
  }

  if (seg1 === 'brendlar' || seg1 === 'deals') {
    const isNew = seg2.toLowerCase() === 'yangi' || seg2.toLowerCase() === 'new';
    const brandId = !isNew && seg2 ? decodeURIComponent(seg2) : null;
    const isEdit = Boolean(brandId && (seg3 === 'tahrirlash' || seg3 === 'edit'));
    return {
      section: 'deals',
      studentTab: 'pending',
      hasExplicitStudentTab: false,
      selectedBrandId: brandId,
      showBrandForm: isNew,
      editBrandMode: isEdit,
      uniViewMode: 'all',
      hasExplicitUniTab: false,
    };
  }

  if (seg1 === 'kategoriyalar' || seg1 === 'categories') {
    return {
      section: 'categories',
      studentTab: 'pending',
      hasExplicitStudentTab: false,
      selectedBrandId: null,
      showBrandForm: false,
      editBrandMode: false,
      uniViewMode: 'all',
      hasExplicitUniTab: false,
    };
  }

  if (seg1 === 'universitetlar' || seg1 === 'universities') {
    const matchedUni = UNI_TABS.find(
      (t) => t.slug === seg2.toLowerCase() || t.id === seg2.toLowerCase()
    );
    return {
      section: 'universities',
      studentTab: 'pending',
      hasExplicitStudentTab: false,
      selectedBrandId: null,
      showBrandForm: false,
      editBrandMode: false,
      uniViewMode: matchedUni ? matchedUni.id : 'all',
      hasExplicitUniTab: Boolean(matchedUni),
    };
  }

  if (seg1 === 'xabarlar' || seg1 === 'messages') {
    return {
      section: 'messages',
      studentTab: 'pending',
      hasExplicitStudentTab: false,
      selectedBrandId: null,
      showBrandForm: false,
      editBrandMode: false,
      uniViewMode: 'all',
      hasExplicitUniTab: false,
    };
  }

  if (seg1 === 'bildirishnomalar' || seg1 === 'notifications') {
    return {
      section: 'notifications',
      studentTab: 'pending',
      hasExplicitStudentTab: false,
      selectedBrandId: null,
      showBrandForm: false,
      editBrandMode: false,
      uniViewMode: 'all',
      hasExplicitUniTab: false,
    };
  }

  if (seg1 === 'sozlamalar' || seg1 === 'settings') {
    return {
      section: 'settings',
      studentTab: 'pending',
      hasExplicitStudentTab: false,
      selectedBrandId: null,
      showBrandForm: false,
      editBrandMode: false,
      uniViewMode: 'all',
      hasExplicitUniTab: false,
    };
  }

  if (seg1 === 'adminlar' || seg1 === 'admins') {
    return {
      section: 'admins',
      studentTab: 'pending',
      hasExplicitStudentTab: false,
      selectedBrandId: null,
      showBrandForm: false,
      editBrandMode: false,
      uniViewMode: 'all',
      hasExplicitUniTab: false,
    };
  }

  return {
    section: 'stats',
    studentTab: 'pending',
    hasExplicitStudentTab: false,
    selectedBrandId: null,
    showBrandForm: false,
    editBrandMode: false,
    uniViewMode: 'all',
    hasExplicitUniTab: false,
  };
}

function normalizeAdminSession(rawSession) {
  if (!rawSession || typeof rawSession !== 'object') return null;
  const loginStr = String(rawSession.login || '').toLowerCase();
  const isSuper =
    Boolean(rawSession.isSuper) ||
    rawSession.role === 'superadmin' ||
    loginStr === 'admin';
  const defaultPerms = isSuper
    ? [
        'stats',
        'students',
        'deals',
        'categories',
        'universities',
        'messages',
        'notifications',
        'admins',
        'settings',
      ]
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
  const { lang } = useLang();
  const { toast } = useToast();
  const { reload } = useStudent();
  const { resolvedTheme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Route-driven hierarchical state (fixes browser back & 2-finger swipe!)
  const routeState = useMemo(() => parseAdminPathname(location.pathname), [location.pathname]);
  const {
    section,
    studentTab,
    hasExplicitStudentTab,
    selectedBrandId,
    showBrandForm,
    editBrandMode,
    uniViewMode,
    hasExplicitUniTab,
  } = routeState;

  const [session, setSession] = useState(() => normalizeAdminSession(api.getAdminSession()));
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Admin-only collapsible left sidebar (desktop) + drawer (mobile)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // Talabalar
  const [profiles, setProfiles] = useState([]);
  const [allRedemptions, setAllRedemptions] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterUniversity, setFilterUniversity] = useState('');
  const [filterStatusInAll, setFilterStatusInAll] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDraftStatus, setStudentDraftStatus] = useState('');
  const [studentDraftCourse, setStudentDraftCourse] = useState('');
  const [reason, setReason] = useState('');
  const [previewDocPerson, setPreviewDocPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  // Brendlar
  const [brands, setBrands] = useState([]);
  const [brandSearch, setBrandSearch] = useState('');
  const [offers, setOffers] = useState([]);
  const [allOffers, setAllOffers] = useState([]);
  const [allOffersCount, setAllOffersCount] = useState(0);
  const [brandFormDirty, setBrandFormDirty] = useState(false);
  const [offerFormDirty, setOfferFormDirty] = useState(false);

  // Global sayt sozlamalari (100% Supabase — Admin -> Sozlamalar)
  const [siteSettings, setSiteSettings] = useState(() =>
    normalizeSiteSettings(DEFAULT_SITE_SETTINGS)
  );
  const [savedSiteSettings, setSavedSiteSettings] = useState(() =>
    normalizeSiteSettings(DEFAULT_SITE_SETTINGS)
  );
  const [savingSiteSettings, setSavingSiteSettings] = useState(false);

  // Kategoriyalar
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES || []);
  const [savedCategoriesSnapshot, setSavedCategoriesSnapshot] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [catInitialSnapshot, setCatInitialSnapshot] = useState('');
  const [catIdInput, setCatIdInput] = useState('');
  const [catLabelUz, setCatLabelUz] = useState('');
  const [catLabelRu, setCatLabelRu] = useState('');
  const [catLabelEn, setCatLabelEn] = useState('');
  const [catIcon, setCatIcon] = useState('Utensils');
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingCategoryOrder, setSavingCategoryOrder] = useState(false);

  // Universitetlar
  const [universities, setUniversities] = useState([]);
  const [activeRegionCard, setActiveRegionCard] = useState(REGIONS[0] || 'Toshkent shahri');
  const [uniSearchQuery, setUniSearchQuery] = useState('');
  const [newUniName, setNewUniName] = useState('');
  const [newUniShort, setNewUniShort] = useState('');
  const [newUniRegion, setNewUniRegion] = useState(REGIONS[0] || 'Toshkent shahri');
  const [savingUni, setSavingUni] = useState(false);

  // Talaba o'zi yozgan ("Boshqa") universitetni tasdiqlash
  const [approvingCustomUni, setApprovingCustomUni] = useState(null);
  const [customApproveName, setCustomApproveName] = useState('');
  const [customApproveShort, setCustomApproveShort] = useState('');
  const [customApproveRegion, setCustomApproveRegion] = useState(REGIONS[0] || 'Toshkent shahri');
  const [savingCustomUni, setSavingCustomUni] = useState(false);

  // Adminlar va huquqlar
  const [admins, setAdmins] = useState([]);
  const [draftAdminPerms, setDraftAdminPerms] = useState({});
  const [savingAdminPerms, setSavingAdminPerms] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminLogin, setNewAdminLogin] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [newAdminPerms, setNewAdminPerms] = useState(['stats', 'students']);
  const [savingNewAdmin, setSavingNewAdmin] = useState(false);

  // Talaba xabarlari (Yordam & Shikoyatlar)
  const [supportMessages, setSupportMessages] = useState([]);
  const [msgFilterStatus, setMsgFilterStatus] = useState('all');
  const [msgFilterCategory, setMsgFilterCategory] = useState('all');
  const [msgSearch, setMsgSearch] = useState('');
  const [msgDrafts, setMsgDrafts] = useState({});
  const [savingMsgId, setSavingMsgId] = useState(null);

  // Admin bildirishnomalar yuborish (registered | guest | all | user)
  const [broadcastNotifications, setBroadcastNotifications] = useState([]);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifAudience, setNotifAudience] = useState('all');
  const [notifTone, setNotifTone] = useState('info');
  const [notifFilterAudience, setNotifFilterAudience] = useState('all');
  const [notifStudentSearch, setNotifStudentSearch] = useState('');
  const [selectedNotifStudent, setSelectedNotifStudent] = useState(null);
  const [sendingNotif, setSendingNotif] = useState(false);

  // Unsaved changes confirmation modal state
  const [pendingNavAction, setPendingNavAction] = useState(null);

  // Lock background page scroll while any Admin modal or mobile drawer is open
  useScrollLock(
    Boolean(
      selectedStudent ||
        previewDocPerson ||
        approvingCustomUni ||
        showLogoutConfirm ||
        pendingNavAction ||
        drawerOpen
    )
  );

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

  const effectiveSection = useMemo(() => {
    if (allowedSections.length === 0) return section;
    if (allowedSections.some((s) => s.id === section)) return section;
    return allowedSections[0].id;
  }, [allowedSections, section]);

  // Dirty-state computations for every section
  const isStudentModalDirty = useMemo(() => {
    if (!selectedStudent) return false;
    return (
      studentDraftStatus !== (selectedStudent.status || 'unverified') ||
      normalizeCourse(studentDraftCourse) !== normalizeCourse(selectedStudent.course) ||
      reason.trim() !== String(selectedStudent.rejection_reason || '').trim()
    );
  }, [selectedStudent, studentDraftStatus, studentDraftCourse, reason]);

  const isCategoryFormDirty = useMemo(() => {
    const cur = JSON.stringify({
      labelUz: catLabelUz.trim(),
      labelRu: catLabelRu.trim(),
      labelEn: catLabelEn.trim(),
      icon: catIcon,
    });
    if (editingCatId) {
      return cur !== catInitialSnapshot;
    }
    return Boolean(catLabelUz.trim() || catLabelRu.trim() || catLabelEn.trim());
  }, [editingCatId, catLabelUz, catLabelRu, catLabelEn, catIcon, catInitialSnapshot]);

  const isCategoryOrderDirty = useMemo(() => {
    if (!savedCategoriesSnapshot) return false;
    const currentOrder = categories.map((c) => c.id).join(',');
    return currentOrder !== savedCategoriesSnapshot;
  }, [categories, savedCategoriesSnapshot]);

  const isUniFormDirty = useMemo(
    () => Boolean(newUniName.trim() || newUniShort.trim()),
    [newUniName, newUniShort]
  );

  const isNewAdminDirty = useMemo(
    () => Boolean(newAdminName.trim() || newAdminLogin.trim() || newAdminPass.trim()),
    [newAdminName, newAdminLogin, newAdminPass]
  );

  const isAdminPermsDirty = useMemo(() => {
    return Object.keys(draftAdminPerms).some((login) => {
      const adm = admins.find((a) => a.login === login);
      if (!adm) return false;
      const orig = [...(adm.permissions || [])].sort().join(',');
      const draft = [...(draftAdminPerms[login] || [])].sort().join(',');
      return orig !== draft;
    });
  }, [draftAdminPerms, admins]);

  const isMessagesDirty = useMemo(() => {
    return Object.entries(msgDrafts).some(([id, draft]) => {
      const orig = supportMessages.find((m) => m.id === id);
      if (!orig) return false;
      return (
        (draft.status ?? orig.status) !== (orig.status || 'new') ||
        String(draft.admin_note ?? orig.admin_note ?? '').trim() !==
          String(orig.admin_note || '').trim()
      );
    });
  }, [msgDrafts, supportMessages]);

  const isNotifFormDirty = useMemo(
    () => Boolean(notifTitle.trim() || notifMessage.trim()),
    [notifTitle, notifMessage]
  );

  const isSiteSettingsDirty = useMemo(() => {
    return (
      JSON.stringify(normalizeSiteSettings(siteSettings)) !==
      JSON.stringify(normalizeSiteSettings(savedSiteSettings))
    );
  }, [siteSettings, savedSiteSettings]);

  const hasUnsavedChanges =
    brandFormDirty ||
    offerFormDirty ||
    isCategoryFormDirty ||
    isCategoryOrderDirty ||
    isUniFormDirty ||
    isNewAdminDirty ||
    isAdminPermsDirty ||
    isMessagesDirty ||
    isNotifFormDirty ||
    isSiteSettingsDirty ||
    isStudentModalDirty;

  // Browser tab refresh / close guard when dirty
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const clearAllDirtyDrafts = useCallback(() => {
    setBrandFormDirty(false);
    setOfferFormDirty(false);
    setEditingCatId(null);
    setCatInitialSnapshot('');
    setCatIdInput('');
    setCatLabelUz('');
    setCatLabelRu('');
    setCatLabelEn('');
    setCatIcon('Utensils');
    setNewUniName('');
    setNewUniShort('');
    setNewAdminName('');
    setNewAdminLogin('');
    setNewAdminPass('');
    setNewAdminPerms(['stats', 'students']);
    setDraftAdminPerms({});
    setMsgDrafts({});
    setNotifTitle('');
    setNotifMessage('');
    setSiteSettings(savedSiteSettings);
    setSelectedStudent(null);
  }, [savedSiteSettings]);

  // Safe navigation wrapper (always uses push navigation so browser Back steps back 1 level!)
  const requestNavigation = useCallback(
    (actionOrPath) => {
      const run = () => {
        setDrawerOpen(false);
        if (typeof actionOrPath === 'string') {
          if (location.pathname !== actionOrPath) {
            navigate(actionOrPath);
          }
        } else if (typeof actionOrPath === 'function') {
          actionOrPath();
        }
      };

      if (hasUnsavedChanges) {
        setPendingNavAction(() => run);
      } else {
        run();
      }
    },
    [hasUnsavedChanges, location.pathname, navigate]
  );

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

    const q = uniSearchQuery.trim().toLowerCase();
    return alphabetSortedUniversities.filter((u) => {
      if (!u || typeof u === 'string') return false;
      if (!u.region) return false;
      const matchReg = u.region === activeRegionCard || norm(u.region) === targetNorm;
      if (!matchReg) return false;
      if (!q) return true;
      return (
        String(u.name || '').toLowerCase().includes(q) ||
        String(u.short_name || '').toLowerCase().includes(q)
      );
    });
  }, [alphabetSortedUniversities, activeRegionCard, uniSearchQuery]);

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

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pList, bList, oList, rList, uList, aList, cList, mList, nList, sData] =
        await Promise.all([
          api.listProfiles ? api.listProfiles().catch(() => []) : Promise.resolve([]),
          api.listBrands ? api.listBrands(true).catch(() => []) : Promise.resolve([]),
          api.listAllOffers ? api.listAllOffers(true).catch(() => []) : Promise.resolve([]),
          api.listRedemptions ? api.listRedemptions().catch(() => []) : Promise.resolve([]),
          api.listUniversitiesAdmin
            ? api.listUniversitiesAdmin().catch(() => [])
            : Promise.resolve([]),
          api.listAdmins ? api.listAdmins().catch(() => []) : Promise.resolve([]),
          api.listCategories
            ? api.listCategories(true).catch(() => DEFAULT_CATEGORIES)
            : Promise.resolve(DEFAULT_CATEGORIES),
          api.listSupportMessages
            ? api.listSupportMessages().catch(() => [])
            : Promise.resolve([]),
          api.listBroadcastNotifications
            ? api.listBroadcastNotifications().catch(() => [])
            : Promise.resolve([]),
          api.getSiteSettings
            ? api.getSiteSettings(true).catch(() => DEFAULT_SITE_SETTINGS)
            : Promise.resolve(DEFAULT_SITE_SETTINGS),
        ]);
      setProfiles(Array.isArray(pList) ? pList : []);
      setBrands(Array.isArray(bList) ? bList : []);
      const validOffers = Array.isArray(oList) ? oList : [];
      setAllOffers(validOffers);
      setAllOffersCount(validOffers.length);
      setAllRedemptions(Array.isArray(rList) ? rList : []);
      setUniversities(Array.isArray(uList) ? uList.filter(Boolean) : []);
      setAdmins(Array.isArray(aList) ? aList : []);
      const cats = Array.isArray(cList) ? cList : DEFAULT_CATEGORIES || [];
      setCategories(cats);
      setSavedCategoriesSnapshot(cats.map((c) => c.id).join(','));
      setSupportMessages(Array.isArray(mList) ? mList : []);
      setBroadcastNotifications(Array.isArray(nList) ? nList : []);
      const normSettings = normalizeSiteSettings(sData || DEFAULT_SITE_SETTINGS);
      setSiteSettings(normSettings);
      setSavedSiteSettings(normSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) loadAll();
  }, [session, loadAll]);

  // Live updates for support messages and broadcast notifications
  useEffect(() => {
    if (!session) return undefined;
    const refreshMsgsAndNotifs = async () => {
      const [mList, nList] = await Promise.all([
        api.listSupportMessages?.().catch(() => null),
        api.listBroadcastNotifications?.().catch(() => null),
      ]);
      if (Array.isArray(mList)) setSupportMessages(mList);
      if (Array.isArray(nList)) setBroadcastNotifications(nList);
    };
    window.addEventListener('imtiyo_messages_changed', refreshMsgsAndNotifs);
    window.addEventListener('imtiyo_notifications_changed', refreshMsgsAndNotifs);
    window.addEventListener('storage', refreshMsgsAndNotifs);
    window.addEventListener('focus', refreshMsgsAndNotifs);
    return () => {
      window.removeEventListener('imtiyo_messages_changed', refreshMsgsAndNotifs);
      window.removeEventListener('imtiyo_notifications_changed', refreshMsgsAndNotifs);
      window.removeEventListener('storage', refreshMsgsAndNotifs);
      window.removeEventListener('focus', refreshMsgsAndNotifs);
    };
  }, [session]);

  useEffect(() => {
    if (session && selectedBrandId && api.listOffers) {
      api.listOffers(selectedBrandId, true).then((res) => setOffers(Array.isArray(res) ? res : []));
    }
  }, [session, selectedBrandId]);

  const selectedBrand = useMemo(
    () => brands.find((b) => String(b.id) === String(selectedBrandId)),
    [brands, selectedBrandId]
  );

  // Dynamic hierarchical Admin breadcrumbs (clicking parent navigates cleanly with history)
  const adminBreadcrumbs = useMemo(() => {
    const secMeta =
      ALL_SECTIONS.find((s) => s.id === effectiveSection) || ALL_SECTIONS[0];

    if (effectiveSection === 'stats') {
      return [{ label: 'Statistika' }];
    }

    if (effectiveSection === 'students') {
      const tabMeta = STUDENT_TABS.find((t) => t.id === studentTab);
      if (hasExplicitStudentTab && tabMeta) {
        return [
          { label: 'Talabalar', onClick: () => requestNavigation('/admin/talabalar') },
          { label: tabMeta.label },
        ];
      }
      return [{ label: 'Talabalar' }];
    }

    if (effectiveSection === 'deals') {
      if (showBrandForm) {
        return [
          { label: 'Brend va e’lonlar', onClick: () => requestNavigation('/admin/brendlar') },
          { label: 'Yangi brend' },
        ];
      }
      if (selectedBrandId) {
        const bName = selectedBrand?.name || selectedBrandId;
        if (editBrandMode) {
          return [
            { label: 'Brend va e’lonlar', onClick: () => requestNavigation('/admin/brendlar') },
            {
              label: bName,
              onClick: () => requestNavigation(`/admin/brendlar/${encodeURIComponent(selectedBrandId)}`),
            },
            { label: 'Tahrirlash' },
          ];
        }
        return [
          { label: 'Brend va e’lonlar', onClick: () => requestNavigation('/admin/brendlar') },
          { label: bName },
        ];
      }
      return [{ label: 'Brend va e’lonlar' }];
    }

    if (effectiveSection === 'universities') {
      const tabMeta = UNI_TABS.find((t) => t.id === uniViewMode);
      if (hasExplicitUniTab && tabMeta) {
        return [
          { label: 'Universitetlar', onClick: () => requestNavigation('/admin/universitetlar') },
          { label: tabMeta.label },
        ];
      }
      return [{ label: 'Universitetlar' }];
    }

    return [{ label: secMeta.label }];
  }, [
    effectiveSection,
    studentTab,
    hasExplicitStudentTab,
    showBrandForm,
    selectedBrandId,
    selectedBrand,
    editBrandMode,
    uniViewMode,
    hasExplicitUniTab,
    requestNavigation,
  ]);

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
    clearAllDirtyDrafts();
    setPreviewDocPerson(null);
    api.logoutAdmin();
    setSession(null);
    setLoginInput('');
    setPasswordInput('');
  };

  // LOGIN SCREEN
  if (!session) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-white px-4 dark:bg-[#070d1f]">
        <PageTopGradient />

        <form
          onSubmit={handleLogin}
          className="relative z-10 w-full max-w-sm rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_24px_60px_-28px_rgba(0,45,150,0.45)] backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-900/95"
        >
          <div className="mb-5 flex flex-col items-center text-center">
            <Logo size="sm" />
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#002D96]/10 px-3 py-1 text-[11px] font-bold text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Boshqaruv paneli
            </div>
            <h1 className="mt-2 text-[20px] font-extrabold text-[#08123A] dark:text-white">
              Admin kirish
            </h1>
            <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
              Davom etish uchun admin login va parolini kiriting
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Login
              </label>
              <input
                required
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="admin"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#08123A] outline-none focus:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Parol
              </label>
              <input
                required
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#08123A] outline-none focus:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {loginError && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-center text-[11.5px] font-semibold text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
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

  // Save student edits from modal (status, rejection reason, course)
  const handleSaveStudentChanges = async () => {
    if (!selectedStudent || !isStudentModalDirty) return;
    if (studentDraftStatus === 'rejected' && !reason.trim()) {
      toast({
        title: 'Rad etish sababini kiriting',
        description: 'Talabaga nima uchun hujjati rad etilgani ko‘rinishi kerak.',
        variant: 'destructive',
      });
      return;
    }

    setBusyId(selectedStudent.id);
    try {
      const reviewerLabel = `${session.name} (${session.isSuper ? 'Super Admin' : 'Moderator'})`;
      const payload = {
        status: studentDraftStatus,
        rejection_reason: studentDraftStatus === 'rejected' ? reason.trim() : '',
        reviewed_by: reviewerLabel,
        course: normalizeCourse(studentDraftCourse),
      };
      await api.saveProfile(selectedStudent.id, payload);
      await reload?.();
      await loadAll();
      setSelectedStudent((prev) => (prev ? { ...prev, ...payload } : null));
      toast({
        title: 'Talaba ma’lumotlari saqlandi!',
        description: `${selectedStudent.name} muvaffaqiyatli yangilandi.`,
      });
    } catch (err) {
      toast({
        title: 'Saqlashda xatolik yuz berdi',
        description: err?.message || 'Qaytadan urinib ko‘ring',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  const resetCategoryForm = () => {
    setEditingCatId(null);
    setCatInitialSnapshot('');
    setCatIdInput('');
    setCatLabelUz('');
    setCatLabelRu('');
    setCatLabelEn('');
    setCatIcon('Utensils');
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catLabelUz.trim() || !isCategoryFormDirty) return;
    setSavingCategory(true);
    try {
      const updated = await api.saveCategory({
        id: editingCatId || catIdInput.trim() || catLabelUz.trim(),
        label_uz: catLabelUz.trim(),
        label_ru: catLabelRu.trim() || catLabelUz.trim(),
        label_en: catLabelEn.trim() || catLabelUz.trim(),
        icon: catIcon,
      });
      const list = Array.isArray(updated) ? updated : [];
      setCategories(list);
      setSavedCategoriesSnapshot(list.map((c) => c.id).join(','));
      resetCategoryForm();
      toast({
        title: editingCatId ? 'Kategoriya saqlandi!' : 'Yangi kategoriya saqlandi!',
      });
    } catch (err) {
      toast({
        title: 'Kategoriyani saqlashda xatolik',
        description: err?.message || 'Qaytadan urinib ko‘ring',
        variant: 'destructive',
      });
    } finally {
      setSavingCategory(false);
    }
  };

  // Stage category ordering locally; commit via explicit Save button
  const handleMoveCategory = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= categories.length) return;
    const copy = [...categories];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setCategories(copy);
  };

  const handleSaveCategoryOrder = async () => {
    if (!isCategoryOrderDirty) return;
    setSavingCategoryOrder(true);
    try {
      const updated = await api.reorderCategories(categories);
      const list = Array.isArray(updated) ? updated : categories;
      setCategories(list);
      setSavedCategoriesSnapshot(list.map((c) => c.id).join(','));
      toast({ title: 'Kategoriyalar tartibi Supabase’ga saqlandi!' });
    } catch (err) {
      toast({
        title: 'Tartibni saqlashda xatolik',
        description: err?.message || 'Supabase RLS ruxsatlarini tekshiring',
        variant: 'destructive',
      });
    } finally {
      setSavingCategoryOrder(false);
    }
  };

  const handleAddUniversity = async (e, forcedRegion = '') => {
    e.preventDefault();
    if (!newUniName.trim() || !isUniFormDirty) return;
    setSavingUni(true);
    try {
      const targetRegion = forcedRegion || newUniRegion || activeRegionCard;
      const updated = await api.addUniversity({
        name: newUniName.trim(),
        short_name: newUniShort.trim(),
        region: targetRegion,
      });
      setUniversities(Array.isArray(updated) ? updated.filter(Boolean) : []);
      const addedTitle = newUniName.trim();
      setNewUniName('');
      setNewUniShort('');
      toast({ title: `«${addedTitle}» (${targetRegion}) saqlandi!` });
    } catch {
      toast({ title: 'Universitetni saqlashda xatolik', variant: 'destructive' });
    } finally {
      setSavingUni(false);
    }
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
        title: `«${finalOfficialName}» bazaga saqlandi!`,
        description: `${affectedStudents.length} nafar talabaning profiliga avtomatik bog‘landi.`,
      });
    } catch {
      toast({ title: 'Saqlashda xatolik yuz berdi', variant: 'destructive' });
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
    if (!session.isSuper || !isNewAdminDirty) return;
    if (!newAdminName.trim() || !newAdminLogin.trim() || !newAdminPass.trim()) return;
    setSavingNewAdmin(true);
    try {
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
    } catch {
      toast({ title: 'Admin yaratishda xatolik', variant: 'destructive' });
    } finally {
      setSavingNewAdmin(false);
    }
  };

  // Stage permission edits locally; persist via Save button
  const handleToggleExistingAdminPerm = (adm, permId) => {
    if (!session.isSuper || adm.isSuper) return;
    const cur = Array.isArray(draftAdminPerms[adm.login])
      ? draftAdminPerms[adm.login]
      : Array.isArray(adm.permissions)
        ? adm.permissions
        : ['stats', 'students'];
    const next = cur.includes(permId)
      ? cur.length > 1
        ? cur.filter((p) => p !== permId)
        : cur
      : [...cur, permId];
    setDraftAdminPerms((prev) => ({ ...prev, [adm.login]: next }));
  };

  const handleSaveAdminPerms = async () => {
    if (!isAdminPermsDirty) return;
    setSavingAdminPerms(true);
    try {
      for (const [login, perms] of Object.entries(draftAdminPerms)) {
        if (api.updateAdminPermissions) {
          await api.updateAdminPermissions(login, perms);
        }
      }
      setAdmins(await api.listAdmins());
      setDraftAdminPerms({});
      toast({ title: 'Admin ruxsatlari saqlandi!' });
    } catch {
      toast({ title: 'Ruxsatlarni saqlashda xatolik', variant: 'destructive' });
    } finally {
      setSavingAdminPerms(false);
    }
  };

  const verifiedCount = profiles.filter((p) => p.status === 'verified').length;
  const pendingCount = profiles.filter((p) => p.status === 'pending').length;
  const unreadMessagesCount = supportMessages.filter((m) => (m.status || 'new') === 'new').length;

  const setMsgDraftField = (msg, field, value) => {
    setMsgDrafts((prev) => ({
      ...prev,
      [msg.id]: {
        status: prev[msg.id]?.status ?? msg.status ?? 'new',
        admin_note: prev[msg.id]?.admin_note ?? msg.admin_note ?? '',
        [field]: value,
      },
    }));
  };

  const isMsgItemDirty = (msg) => {
    const draft = msgDrafts[msg.id];
    if (!draft) return false;
    return (
      (draft.status ?? msg.status) !== (msg.status || 'new') ||
      String(draft.admin_note ?? msg.admin_note ?? '').trim() !==
        String(msg.admin_note || '').trim()
    );
  };

  const handleSaveMessage = async (msg) => {
    if (!isMsgItemDirty(msg)) return;
    const draft = msgDrafts[msg.id];
    setSavingMsgId(msg.id);
    try {
      await api.updateSupportMessage(msg.id, {
        status: draft.status,
        admin_note: String(draft.admin_note || '').trim(),
      });
      const fresh = await api.listSupportMessages();
      setSupportMessages(Array.isArray(fresh) ? fresh : []);
      setMsgDrafts((prev) => {
        const next = { ...prev };
        delete next[msg.id];
        return next;
      });
      toast({ title: 'Xabar holati saqlandi!' });
    } catch {
      toast({ title: 'Xabarni saqlashda xatolik', variant: 'destructive' });
    } finally {
      setSavingMsgId(null);
    }
  };

  const handleDeleteMessage = async (id) => {
    await api.deleteSupportMessage(id);
    setSupportMessages((prev) => prev.filter((m) => m.id !== id));
    setMsgDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    toast({ title: 'Xabar o‘chirildi' });
  };

  const notifMatchedStudents = useMemo(() => {
    const rawQ = notifStudentSearch.trim().toLowerCase().replace(/^#/, '');
    if (!rawQ) return profiles.slice(0, 8);
    return profiles
      .filter((p) => {
        if (!p) return false;
        const sid = String(p.student_id || '').toLowerCase();
        const name = String(p.name || p.full_name || '').toLowerCase();
        const email = String(p.email || '').toLowerCase();
        const phone = String(p.phone || '').toLowerCase();
        return (
          sid.includes(rawQ) ||
          name.includes(rawQ) ||
          email.includes(rawQ) ||
          phone.includes(rawQ)
        );
      })
      .slice(0, 12);
  }, [profiles, notifStudentSearch]);

  const handleSendBroadcastNotification = async (e) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    if (notifAudience === 'user' && !selectedNotifStudent) {
      toast({
        title: 'Talabani tanlang',
        description: 'Talaba ID raqamini yozib ro‘yxatdan kerakli foydalanuvchini tanlang.',
        variant: 'destructive',
      });
      return;
    }
    setSendingNotif(true);
    try {
      await api.createBroadcastNotification({
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        audience: notifAudience,
        tone: notifTone,
        target_student_id: notifAudience === 'user' ? selectedNotifStudent.student_id : '',
        target_profile_id: notifAudience === 'user' ? selectedNotifStudent.id : '',
        target_name: notifAudience === 'user' ? selectedNotifStudent.name : '',
      });
      const fresh = await api.listBroadcastNotifications();
      setBroadcastNotifications(Array.isArray(fresh) ? fresh : []);
      setNotifTitle('');
      setNotifMessage('');
      if (notifAudience === 'user') {
        const targetLabel = `${selectedNotifStudent.name} (#${selectedNotifStudent.student_id})`;
        setSelectedNotifStudent(null);
        setNotifStudentSearch('');
        toast({
          title: 'Shaxsiy bildirishnoma yuborildi!',
          description: `${targetLabel} foydalanuvchisining bildirishnoma oynasiga yetkazildi.`,
        });
      } else {
        toast({
          title: 'Bildirishnoma yuborildi!',
          description:
            notifAudience === 'registered'
              ? 'Login qilgan barcha foydalanuvchilarga yetkazildi.'
              : notifAudience === 'guest'
                ? 'Yangi foydalanuvchilar (mehmonlar) uchun faollashtirildi.'
                : 'Barcha foydalanuvchilarga (login qilgan va yangi) yetkazildi.',
        });
      }
    } catch {
      toast({ title: 'Bildirishnoma yuborishda xatolik', variant: 'destructive' });
    } finally {
      setSendingNotif(false);
    }
  };

  const handleDeleteBroadcastNotification = async (id) => {
    await api.deleteBroadcastNotification(id);
    setBroadcastNotifications((prev) => prev.filter((n) => n.id !== id));
    toast({ title: 'Bildirishnoma o‘chirildi' });
  };

  const filteredSupportMessages = useMemo(() => {
    const q = msgSearch.trim().toLowerCase();
    return supportMessages.filter((m) => {
      const st = m.status || 'new';
      if (msgFilterStatus !== 'all' && st !== msgFilterStatus) return false;
      const cat = m.category === 'question' ? 'help' : m.category || 'help';
      if (msgFilterCategory !== 'all' && cat !== msgFilterCategory) return false;
      if (!q) return true;
      return (
        String(m.full_name || '').toLowerCase().includes(q) ||
        String(m.contact || '').toLowerCase().includes(q) ||
        String(m.email || '').toLowerCase().includes(q) ||
        String(m.student_id || '').toLowerCase().includes(q) ||
        String(m.message || '').toLowerCase().includes(q)
      );
    });
  }, [supportMessages, msgFilterStatus, msgFilterCategory, msgSearch]);

  const filteredBroadcastNotifications = useMemo(() => {
    if (notifFilterAudience === 'all') return broadcastNotifications;
    return broadcastNotifications.filter((n) => (n.audience || 'all') === notifFilterAudience);
  }, [broadcastNotifications, notifFilterAudience]);

  // Kategoriyalar bo'yicha faol brendlar va faol chegirmalar hisoblagichi (avtomatik yangilanadi)
  const categoryStats = useMemo(() => {
    const activeBrands = brands.filter((b) => b && b.active !== false);
    const activeOffers = allOffers.filter((o) => o && o.active !== false);
    const total = {
      brandCount: activeBrands.length,
      offerCount: activeOffers.length,
    };

    const byCategory = {};
    categories.forEach((cat) => {
      if (!cat?.id) return;
      if (cat.id === 'all') {
        byCategory[cat.id] = total;
        return;
      }
      const matchedBrands =
        cat.id === 'new'
          ? activeBrands.filter((b) => Array.isArray(b.sections) && b.sections.includes('new'))
          : activeBrands.filter(
              (b) =>
                b.category === cat.id ||
                (Array.isArray(b.categories) && b.categories.includes(cat.id))
            );
      const brandIdSet = new Set();
      matchedBrands.forEach((b) => {
        if (b.id) brandIdSet.add(String(b.id));
        if (b.recordId) brandIdSet.add(String(b.recordId));
      });
      const matchedOffersCount = activeOffers.filter((o) =>
        brandIdSet.has(String(o.brand_id))
      ).length;
      byCategory[cat.id] = {
        brandCount: matchedBrands.length,
        offerCount: matchedOffersCount,
      };
    });

    return { total, byCategory };
  }, [brands, allOffers, categories]);

  const handleSaveSiteSettings = async (e) => {
    e.preventDefault();
    if (!isSiteSettingsDirty) return;
    setSavingSiteSettings(true);
    try {
      const saved = await api.saveSiteSettings(siteSettings);
      const normalized = normalizeSiteSettings(saved);
      setSiteSettings(normalized);
      setSavedSiteSettings(normalized);
      toast({
        title: 'Sozlamalar Supabase’ga muvaffaqiyatli saqlandi!',
        description: 'O‘zgarishlar barcha foydalanuvchilar (jumladan Incognito) uchun kuchga kirdi.',
      });
    } catch (err) {
      toast({
        title: 'Sozlamalarni saqlashda xatolik',
        description: err?.message || 'Supabase site_settings jadvali va RLS ruxsatlarini tekshiring.',
        variant: 'destructive',
      });
    } finally {
      setSavingSiteSettings(false);
    }
  };

  const selectedStudentDeals = selectedStudent
    ? allRedemptions.filter((r) => r.student_name === selectedStudent.name)
    : [];

  const openStudentModal = (person) => {
    setSelectedStudent(person);
    setStudentDraftStatus(person.status || 'unverified');
    setStudentDraftCourse(normalizeCourse(person.course));
    setReason(person.rejection_reason || '');
  };

  const closeStudentModal = () => {
    if (isStudentModalDirty) {
      setPendingNavAction(() => () => setSelectedStudent(null));
    } else {
      setSelectedStudent(null);
    }
  };

  const inputCls =
    'rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-[#08123A] outline-none focus:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-400';

  return (
    <div className="relative flex min-h-screen bg-white text-[#08123A] transition-colors dark:bg-[#070d1f] dark:text-slate-100">
      {/* MOBIL SLIDE-OVER DRAWER */}
      <div
        className={cn(
          'fixed inset-0 z-50 flex transition-opacity duration-200 md:hidden',
          drawerOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <div
          className="fixed inset-0 bg-[#04091a]/60 backdrop-blur-xs"
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={cn(
            'relative z-10 flex w-72 flex-col justify-between border-r border-slate-200 bg-white p-4 shadow-2xl transition-transform duration-300 ease-out dark:border-slate-800 dark:bg-[#0b1228]',
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="mb-4 flex shrink-0 items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800">
              <Logo size="sm" />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
              {allowedSections.map((item) => {
                const Icon = item.icon;
                const active = effectiveSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => requestNavigation(`/admin/${item.slug}`)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-[13px] font-bold transition-all',
                      active
                        ? 'bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    )}
                  >
                    <span className="flex items-center gap-3 truncate">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.id === 'students' && pendingCount > 0 && (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-extrabold',
                          active
                            ? 'bg-white/25 text-white'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                        )}
                      >
                        {pendingCount}
                      </span>
                    )}
                    {item.id === 'messages' && unreadMessagesCount > 0 && (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-extrabold',
                          active
                            ? 'bg-white/25 text-white'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                        )}
                      >
                        {unreadMessagesCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-2.5 text-[12.5px] font-bold text-rose-600 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-400"
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </button>
        </aside>
      </div>

      {/* DESKTOP COLLAPSIBLE LEFT SIDEBAR (Admin panel ONLY!) */}
      <aside
        className={cn(
          'sticky top-0 z-30 hidden h-screen shrink-0 flex-col justify-between border-r border-slate-200/80 bg-white/90 backdrop-blur-2xl transition-[width] duration-300 ease-in-out dark:border-slate-800 dark:bg-[#0b1228]/95 md:flex',
          sidebarCollapsed ? 'w-[76px]' : 'w-64'
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
          {/* Sidebar top logo + collapse button */}
          <div
            className={cn(
              'mb-4 flex shrink-0 border-b border-slate-100 pb-3.5 dark:border-slate-800',
              sidebarCollapsed ? 'flex-col items-center gap-2.5' : 'items-center justify-between px-1'
            )}
          >
            {sidebarCollapsed ? <Logo size="sm" iconOnly /> : <Logo size="sm" />}
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              title={sidebarCollapsed ? 'Menyuni ochish' : 'Menyuni yashirish'}
              aria-label={sidebarCollapsed ? 'Menyuni ochish' : 'Menyuni yashirish'}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-[#1D6FF2] hover:text-[#002D96] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-sky-400 dark:hover:text-sky-300"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>

          <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {allowedSections.map((item) => {
              const Icon = item.icon;
              const active = effectiveSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={sidebarCollapsed ? item.label : undefined}
                  onClick={() => requestNavigation(`/admin/${item.slug}`)}
                  className={cn(
                    'relative flex w-full items-center rounded-2xl py-2.5 text-[13px] font-bold transition-all',
                    sidebarCollapsed ? 'justify-center px-0' : 'justify-between gap-2.5 px-3.5',
                    active
                      ? 'bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white shadow-[0_10px_22px_-12px_rgba(0,45,150,0.85)]'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-[#002D96] dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-sky-300'
                  )}
                >
                  <span className="flex items-center gap-3 overflow-hidden">
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </span>

                  {item.id === 'students' && pendingCount > 0 && !sidebarCollapsed && (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-extrabold',
                        active
                          ? 'bg-white/25 text-white'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                      )}
                    >
                      {pendingCount}
                    </span>
                  )}

                  {item.id === 'students' && pendingCount > 0 && sidebarCollapsed && (
                    <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-[#0b1228]" />
                  )}

                  {item.id === 'messages' && unreadMessagesCount > 0 && !sidebarCollapsed && (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-extrabold',
                        active
                          ? 'bg-white/25 text-white'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                      )}
                    >
                      {unreadMessagesCount}
                    </span>
                  )}

                  {item.id === 'messages' && unreadMessagesCount > 0 && sidebarCollapsed && (
                    <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0b1228]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Admin Badge + Logout */}
        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          {!sidebarCollapsed && (
            <div className="mb-2.5 rounded-2xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/70">
              <p className="truncate text-[12px] font-extrabold text-[#08123A] dark:text-white">
                {session.name}
              </p>
              <p className="text-[10.5px] font-bold text-[#1D6FF2] dark:text-sky-400">
                {session.isSuper ? '👑 Super Admin' : '🛡️ Moderator'}
              </p>
            </div>
          )}
          <button
            type="button"
            title={sidebarCollapsed ? 'Chiqish' : undefined}
            onClick={() => setShowLogoutConfirm(true)}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/80 py-2.5 text-[12.5px] font-bold text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/70',
              sidebarCollapsed ? 'px-0' : 'px-3'
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Chiqish</span>}
          </button>
        </div>
      </aside>

      {/* O'NG ASOSIY WORKSPACE */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <PageTopGradient />

        {/* TOP BAR */}
        <header className="sticky top-0 z-20 border-b border-white/60 bg-white/75 px-4 py-3 backdrop-blur-2xl dark:border-slate-800 dark:bg-[#0b1228]/80 md:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Menyuni ochish"
                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-[#08123A] dark:border-slate-700 dark:bg-slate-800 dark:text-white md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="md:hidden">
                <Logo size="sm" />
              </div>
              <span className="hidden rounded-full bg-[#002D96]/10 px-3 py-1 text-[11px] font-extrabold text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300 sm:inline-block">
                {session.isSuper ? '👑 Super Admin' : '🛡️ Moderator'} · {session.name}
              </span>
              {hasUnsavedChanges && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-extrabold text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="hidden sm:inline">Saqlanmagan o‘zgarishlar</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                aria-label="Temani almashtirish"
                className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-[#08123A] transition-colors hover:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300"
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => requestNavigation('/')}
                className="hidden rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-bold text-slate-600 transition-colors hover:border-[#1D6FF2] hover:text-[#002D96] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:inline-flex"
              >
                Saytga o‘tish
              </button>

              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/80 px-3.5 py-1.5 text-[12px] font-bold text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-400 md:hidden"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Chiqish</span>
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-5 md:px-6">
          {/* UNIFIED BREADCRUMB (YUQORI CHAP BURCHAKDA) */}
          <PageBreadcrumb
            items={[
              {
                label: 'Admin panel',
                isRoot: true,
                onClick: () => requestNavigation('/admin'),
              },
              ...adminBreadcrumbs,
            ]}
          />

          {/* 1. STATISTIKA */}
          {effectiveSection === 'stats' && (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
              <div className="rounded-[24px] border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                <p className="text-[11px] font-bold uppercase text-slate-400">
                  Jami foydalanuvchilar
                </p>
                <p className="mt-1.5 text-[28px] font-black text-[#08123A] dark:text-white">
                  {profiles.length}
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                <p className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                  Tasdiqlangan talaba
                </p>
                <p className="mt-1.5 text-[28px] font-black text-emerald-600 dark:text-emerald-400">
                  {verifiedCount}
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                <p className="text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400">
                  Kutilayotgan ariza
                </p>
                <p className="mt-1.5 text-[28px] font-black text-amber-600 dark:text-amber-400">
                  {pendingCount}
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                <p className="text-[11px] font-bold uppercase text-slate-400">Hamkor brendlar</p>
                <p className="mt-1.5 text-[28px] font-black text-[#002D96] dark:text-sky-400">
                  {brands.length}
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                <p className="text-[11px] font-bold uppercase text-slate-400">Faol chegirmalar</p>
                <p className="mt-1.5 text-[28px] font-black text-[#1D6FF2] dark:text-sky-300">
                  {allOffersCount}
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                <p className="text-[11px] font-bold uppercase text-slate-400">Universitetlar</p>
                <p className="mt-1.5 text-[28px] font-black text-[#08123A] dark:text-white">
                  {universities.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => requestNavigation('/admin/xabarlar')}
                className="rounded-[24px] border border-slate-200/80 bg-white/95 p-5 text-left shadow-sm backdrop-blur-xl transition-all hover:border-[#1D6FF2]/40 dark:border-slate-800 dark:bg-slate-900/90"
              >
                <p className="text-[11px] font-bold uppercase text-rose-500 dark:text-rose-400">
                  Yangi xabarlar
                </p>
                <p className="mt-1.5 text-[28px] font-black text-rose-600 dark:text-rose-400">
                  {unreadMessagesCount}
                  <span className="ml-1.5 text-[12px] font-bold text-slate-400">
                    / {supportMessages.length}
                  </span>
                </p>
              </button>
              <button
                type="button"
                onClick={() => requestNavigation('/admin/bildirishnomalar')}
                className="rounded-[24px] border border-slate-200/80 bg-white/95 p-5 text-left shadow-sm backdrop-blur-xl transition-all hover:border-[#1D6FF2]/40 dark:border-slate-800 dark:bg-slate-900/90"
              >
                <p className="text-[11px] font-bold uppercase text-indigo-500 dark:text-indigo-400">
                  Bildirishnomalar
                </p>
                <p className="mt-1.5 text-[28px] font-black text-indigo-600 dark:text-indigo-400">
                  {broadcastNotifications.length}
                </p>
              </button>
            </div>
          )}

          {/* 2. TALABALAR (HIERARCHICAL ROUTES: /admin/talabalar -> /admin/talabalar/tasdiqlanganlar) */}
          {effectiveSection === 'students' && (
            <div className="space-y-3">
              <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                {STUDENT_TABS.map((item) => {
                  const count =
                    item.id === 'all'
                      ? profiles.length
                      : profiles.filter((p) => p.status === item.id).length;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => requestNavigation(`/admin/talabalar/${item.slug}`)}
                      className={cn(
                        'flex-1 shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-[12px] font-bold transition-all',
                        studentTab === item.id
                          ? 'bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white shadow-sm'
                          : 'text-slate-600 hover:text-[#002D96] dark:text-slate-300 dark:hover:text-sky-300'
                      )}
                    >
                      {item.label}
                      <span className="ml-1.5 opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>

              {studentTab === 'all' ? (
                <div className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200/80 bg-white/90 p-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="relative lg:col-span-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Ism, ID, tel yoki email bo‘yicha qidirish..."
                      className={cn(inputCls, 'h-9 w-full pl-9 pr-3 text-[12px]')}
                    />
                  </div>

                  <RegionSelect
                    value={filterRegion}
                    onChange={setFilterRegion}
                    placeholder="Barcha viloyatlar"
                    clearLabel="Barcha viloyatlar"
                    allowClear
                    compact
                    showIcon={false}
                  />

                  <UniversitySelect
                    universities={alphabetSortedUniversities}
                    value={filterUniversity}
                    onChange={setFilterUniversity}
                    placeholder="Barcha universitetlar"
                    clearLabel="Barcha universitetlar"
                    allowClear
                    allowOther={false}
                    compact
                    showIcon={false}
                  />

                  <div className="flex gap-1.5">
                    <select
                      value={filterStatusInAll}
                      onChange={(e) => setFilterStatusInAll(e.target.value)}
                      className={cn(inputCls, 'h-9 flex-1 px-2.5 text-[12px]')}
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
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
                    className={cn(inputCls, 'h-10 w-full rounded-2xl pl-10 pr-4')}
                  />
                </div>
              )}

              {loading ? (
                <div className="grid place-items-center rounded-[24px] bg-white/80 py-14 dark:bg-slate-900/70">
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
                    <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 py-12 text-center dark:border-slate-700 dark:bg-slate-900/60">
                      <FileText className="mx-auto h-5 w-5 text-slate-400" />
                      <p className="mt-2 text-[12.5px] font-semibold text-[#08123A] dark:text-slate-200">
                        Talabalar topilmadi
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredStudents.map((person) => {
                        const isCustomUni = (person.university || '')
                          .toLowerCase()
                          .startsWith('boshqa');
                        return (
                          <li
                            key={person.id}
                            onClick={() => openStudentModal(person)}
                            className="group flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 transition-colors hover:bg-[#1D6FF2]/[0.05] dark:hover:bg-slate-800/70"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#002D96]/10 text-[11.5px] font-extrabold text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300">
                                {(person.name || 'T').slice(0, 1).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="truncate text-[13px] font-extrabold text-[#08123A] group-hover:text-[#002D96] dark:text-white dark:group-hover:text-sky-300">
                                    {person.name}
                                  </p>
                                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#002D96] dark:bg-slate-800 dark:text-sky-300">
                                    #{person.student_id}
                                  </span>
                                  {person.course && (
                                    <span className="rounded-md bg-[#1D6FF2]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#1D6FF2] dark:bg-sky-500/15 dark:text-sky-300">
                                      {person.course}-kurs
                                    </span>
                                  )}
                                  {person.document_url && (
                                    <span className="inline-flex items-center gap-0.5 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-[#1D6FF2] dark:bg-sky-950/60 dark:text-sky-300">
                                      <FileText className="h-2.5 w-2.5" />
                                      Fayl
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                                  <span
                                    className={cn(
                                      'max-w-[260px] truncate',
                                      isCustomUni && 'font-bold text-indigo-600 dark:text-indigo-400'
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
                              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#002D96] dark:text-slate-600 dark:group-hover:text-sky-300" />
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

          {/* 3. BRENDLAR VA AKSIYALAR (HIERARCHICAL ROUTES: /admin/brendlar -> /admin/brendlar/:id) */}
          {effectiveSection === 'deals' && (
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
                        className={cn(inputCls, 'h-10 w-full rounded-2xl pl-10 pr-4')}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() =>
                        requestNavigation(
                          showBrandForm ? '/admin/brendlar' : '/admin/brendlar/yangi'
                        )
                      }
                      className="h-10 rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] px-5 text-[12.5px] font-bold text-white"
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      {showBrandForm ? 'Formani yopish' : 'Yangi brend qo‘shish'}
                    </Button>
                  </div>

                  {showBrandForm && (
                    <BrandForm
                      initialBrand={null}
                      onDirtyChange={setBrandFormDirty}
                      onCancel={() => requestNavigation('/admin/brendlar')}
                      onSaved={(saved) => {
                        setBrandFormDirty(false);
                        loadAll();
                        navigate(`/admin/brendlar/${encodeURIComponent(saved.id)}`);
                        toast({
                          title: 'Yangi brend saqlandi! Endi unga chegirmalar qo‘shing.',
                        });
                      }}
                    />
                  )}

                  <div className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="border-b border-slate-100 px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                      Hamkor brendlar alifbo tartibida (A–Z) ({alphabetSortedBrands.length})
                    </div>
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                      {alphabetSortedBrands.map((b) => (
                        <li
                          key={b.id}
                          onClick={() =>
                            requestNavigation(`/admin/brendlar/${encodeURIComponent(b.id)}`)
                          }
                          className="group flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[#1D6FF2]/[0.05] dark:hover:bg-slate-800/70"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-100 bg-white p-1 text-[12px] font-black text-[#08123A] shadow-sm">
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
                                <p className="truncate text-[14px] font-extrabold text-[#08123A] group-hover:text-[#002D96] dark:text-white dark:group-hover:text-sky-300">
                                  {b.name}
                                </p>
                                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10.5px] font-extrabold text-amber-800 dark:text-amber-300">
                                  ⭐ {b.tagline?.uz || b.discount}
                                </span>
                              </div>
                              <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                                Kategoriyalar: {(b.categories || [b.category]).join(', ')} ·{' '}
                                {b.has_map ? '📍 Xarita ulangan' : 'Xaritasiz'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="hidden text-[11.5px] font-bold text-[#1D6FF2] group-hover:underline dark:text-sky-400 sm:inline">
                              Chegirmalarni boshqarish
                            </span>
                            <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#002D96] dark:group-hover:text-sky-300" />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-slate-200/80 bg-white/90 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-100 bg-white p-1.5 font-black text-[#08123A]">
                        {selectedBrand.logo_url ? (
                          <img
                            src={selectedBrand.logo_url}
                            alt={selectedBrand.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          selectedBrand.monogram
                        )}
                      </span>
                      <div>
                        <h2 className="text-[17px] font-extrabold text-[#08123A] dark:text-white">
                          {selectedBrand.name}
                        </h2>
                        <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                          {offers.length} ta chegirma ·{' '}
                          {selectedBrand.has_map ? 'Xarita ulangan' : 'Xaritasiz'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          requestNavigation(
                            editBrandMode
                              ? `/admin/brendlar/${encodeURIComponent(selectedBrand.id)}`
                              : `/admin/brendlar/${encodeURIComponent(selectedBrand.id)}/tahrirlash`
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-bold text-[#002D96] hover:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        {editBrandMode ? 'Tahrirlashni yopish' : 'Brendni tahrirlash'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await api.deleteBrand(selectedBrand.id);
                          setBrandFormDirty(false);
                          setOfferFormDirty(false);
                          await loadAll();
                          navigate('/admin/brendlar');
                          toast({ title: `${selectedBrand.name} o‘chirildi` });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-2 text-[12px] font-bold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Brendni o‘chirish
                      </button>
                    </div>
                  </div>

                  {editBrandMode && (
                    <BrandForm
                      initialBrand={selectedBrand}
                      onDirtyChange={setBrandFormDirty}
                      onCancel={() =>
                        requestNavigation(`/admin/brendlar/${encodeURIComponent(selectedBrand.id)}`)
                      }
                      onSaved={() => {
                        setBrandFormDirty(false);
                        loadAll();
                        navigate(`/admin/brendlar/${encodeURIComponent(selectedBrand.id)}`);
                        toast({ title: 'Brend ma’lumotlari saqlandi!' });
                      }}
                    />
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[24px] border border-slate-200/80 bg-white/95 p-5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                      <div className="mb-3">
                        <p className="text-[14px] font-extrabold text-[#08123A] dark:text-white">
                          {selectedBrand.name} chegirmalari ({offers.length})
                        </p>
                        <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                          «⭐ Eng zo‘ri» deb belgilangan chegirma brendning asosiy yorlig‘i bo‘ladi
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
                                    ? 'border-amber-400 bg-amber-50/40 dark:border-amber-500/50 dark:bg-amber-500/10'
                                    : 'border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/60'
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-[13.5px] font-extrabold text-[#08123A] dark:text-white">
                                      {localizedTitle(offer, lang)}
                                    </p>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
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
                                          const freshOffers = await api.listOffers(
                                            selectedBrand.id,
                                            true
                                          );
                                          setOffers(freshOffers);
                                          await loadAll();
                                          toast({
                                            title: 'Eng zo‘r chegirma saqlandi!',
                                            description:
                                              'Brendning asosiy yorlig‘i va slaydi yangilandi.',
                                          });
                                        }}
                                        className={cn(
                                          'rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold transition-colors',
                                          isBestOffer
                                            ? 'bg-amber-400 text-[#08123A]'
                                            : 'bg-slate-100 text-slate-600 hover:bg-amber-100 dark:bg-slate-700 dark:text-slate-200'
                                        )}
                                      >
                                        {isBestOffer
                                          ? '⭐ Eng zo‘ri'
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
                                        setAllOffers((list) => list.filter((o) => o.id !== offer.id));
                                        setAllOffersCount((c) => Math.max(0, c - 1));
                                        toast({ title: 'Chegirma o‘chirildi' });
                                      }
                                    }}
                                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-[12px] font-semibold text-slate-400 dark:border-slate-700">
                          Bu brendda hozircha chegirmalar yo‘q. O‘ng tomondan yangi chegirma
                          qo‘shing.
                        </p>
                      )}
                    </div>

                    <OfferForm
                      brand={selectedBrand}
                      onDirtyChange={setOfferFormDirty}
                      onSaved={async (created) => {
                        const freshOffers = await api.listOffers(selectedBrand.id, true);
                        setOffers(freshOffers.length ? freshOffers : [...offers, created]);
                        setAllOffersCount((c) => c + 1);
                        await loadAll();
                        toast({
                          title: 'Yangi chegirma saqlandi!',
                          description: created.title_uz,
                        });
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. KATEGORIYALAR (DIRTY-STATE SAQLASH + TARTIBNI SAQLASH) */}
          {effectiveSection === 'categories' && (
            <div className="grid gap-4 md:grid-cols-2">
              <form
                onSubmit={handleSaveCategory}
                className="rounded-[24px] border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#002D96] dark:text-sky-400" />
                    <h3 className="text-[14px] font-extrabold text-[#08123A] dark:text-white">
                      {editingCatId ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya qo‘shish'}
                    </h3>
                  </div>
                  {editingCatId && (
                    <button
                      type="button"
                      onClick={resetCategoryForm}
                      className="text-[11.5px] font-bold text-slate-400 hover:text-slate-600"
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
                    className={cn(inputCls, 'w-full')}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={catLabelRu}
                      onChange={(e) => setCatLabelRu(e.target.value)}
                      placeholder="Ruscha (Еда)"
                      className={cn(inputCls, 'w-full text-[12px]')}
                    />
                    <input
                      value={catLabelEn}
                      onChange={(e) => setCatLabelEn(e.target.value)}
                      placeholder="Inglizcha (Food)"
                      className={cn(inputCls, 'w-full text-[12px]')}
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
                              : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          )}
                        >
                          <IconComp className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    type="submit"
                    disabled={savingCategory || !isCategoryFormDirty || !catLabelUz.trim()}
                    className="h-10 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[12.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {savingCategory ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Saqlanmoqda...
                      </>
                    ) : (
                      <>
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        Saqlash
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <div className="rounded-[24px] border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-[14px] font-extrabold text-[#08123A] dark:text-white">
                    Mavjud kategoriyalar ({categories.length})
                  </h3>
                  <Button
                    type="button"
                    onClick={handleSaveCategoryOrder}
                    disabled={savingCategoryOrder || !isCategoryOrderDirty}
                    className="h-8 rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] px-4 text-[11.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {savingCategoryOrder ? (
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="mr-1.5 h-3 w-3" />
                    )}
                    Saqlash
                  </Button>
                </div>

                <ul className="space-y-2">
                  {!categories.some((c) => c.id === 'all') && (
                    <li className="flex items-center justify-between gap-2 rounded-2xl border border-[#1D6FF2]/25 bg-[#1D6FF2]/[0.05] px-3.5 py-2.5 dark:border-sky-500/30 dark:bg-sky-500/10">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="text-[13px] font-extrabold text-[#002D96] dark:text-sky-300">
                          Barchasi
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#002D96] shadow-xs dark:bg-slate-800 dark:text-sky-300">
                          {categoryStats.total.brandCount} ta brend •{' '}
                          {categoryStats.total.offerCount} ta chegirma
                        </span>
                      </div>
                    </li>
                  )}
                  {categories.map((cat, idx) => {
                    const IconComp = CATEGORY_ICON_MAP?.[cat.icon] || Tag;
                    const counts = categoryStats.byCategory[cat.id] || {
                      brandCount: 0,
                      offerCount: 0,
                    };
                    const hasItems = counts.brandCount > 0 || counts.offerCount > 0;
                    return (
                      <li
                        key={cat.id || idx}
                        className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/60"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#002D96]/10 text-[#002D96] dark:bg-sky-500/15 dark:text-sky-400">
                            <IconComp className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="truncate text-[13px] font-bold text-[#08123A] dark:text-white">
                                {cat.id === 'all' ? `${cat.label_uz} (Barchasi)` : cat.label_uz}
                              </p>
                              <span
                                className={cn(
                                  'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10.5px] font-extrabold',
                                  cat.id === 'all'
                                    ? 'bg-[#002D96]/10 text-[#002D96] dark:bg-sky-500/20 dark:text-sky-300'
                                    : hasItems
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                      : 'bg-slate-200/70 text-slate-500 dark:bg-slate-700/70 dark:text-slate-400'
                                )}
                              >
                                {counts.brandCount} ta brend • {counts.offerCount} ta chegirma
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveCategory(idx, -1)}
                            disabled={idx === 0}
                            className="grid h-7 w-7 place-items-center rounded-full bg-white text-slate-600 shadow-sm disabled:opacity-30 dark:bg-slate-700 dark:text-slate-200"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveCategory(idx, 1)}
                            disabled={idx === categories.length - 1}
                            className="grid h-7 w-7 place-items-center rounded-full bg-white text-slate-600 shadow-sm disabled:opacity-30 dark:bg-slate-700 dark:text-slate-200"
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
                              setCatInitialSnapshot(
                                JSON.stringify({
                                  labelUz: (cat.label_uz || '').trim(),
                                  labelRu: (cat.label_ru || '').trim(),
                                  labelEn: (cat.label_en || '').trim(),
                                  icon: cat.icon || 'Utensils',
                                })
                              );
                            }}
                            className="grid h-7 w-7 place-items-center rounded-full bg-blue-50 text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          {cat.id !== 'all' && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const next = await api.deleteCategory(cat.id);
                                  const list = Array.isArray(next) ? next : [];
                                  setCategories(list);
                                  setSavedCategoriesSnapshot(list.map((c) => c.id).join(','));
                                  toast({ title: 'Kategoriya Supabase’dan o‘chirildi' });
                                } catch (err) {
                                  toast({
                                    title: 'Kategoriyani o‘chirishda xatolik',
                                    description: err?.message || 'Supabase RLS ruxsatlarini tekshiring',
                                    variant: 'destructive',
                                  });
                                }
                              }}
                              className="grid h-7 w-7 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400"
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

          {/* 5. UNIVERSITETLAR (HIERARCHICAL ROUTES + SAQLASH TUGMASI) */}
          {effectiveSection === 'universities' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                  <button
                    type="button"
                    onClick={() => requestNavigation('/admin/universitetlar/hammasi')}
                    className={cn(
                      'rounded-xl px-3.5 py-2 text-[12px] font-extrabold transition-all',
                      uniViewMode === 'all'
                        ? 'bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    )}
                  >
                    Hamma universitetlar (A–Z) ({universities.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => requestNavigation('/admin/universitetlar/viloyatlar')}
                    className={cn(
                      'rounded-xl px-3.5 py-2 text-[12px] font-extrabold transition-all',
                      uniViewMode === 'regions'
                        ? 'bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    )}
                  >
                    Hamma viloyatlar ({REGIONS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => requestNavigation('/admin/universitetlar/talaba-yozgan')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-extrabold transition-all',
                      uniViewMode === 'custom'
                        ? 'bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white'
                        : 'text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-slate-800'
                    )}
                  >
                    <span>Talaba o‘zi yozgan universitetlar</span>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
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
                    className={cn(inputCls, 'h-10 w-full pl-9 pr-3')}
                  />
                </div>
              </div>

              {uniViewMode === 'all' && (
                <div className="space-y-4">
                  <form
                    onSubmit={(e) => handleAddUniversity(e, '')}
                    className="grid grid-cols-1 gap-2.5 rounded-[24px] border border-slate-200/80 bg-white/95 p-4 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sm:grid-cols-4"
                  >
                    <input
                      required
                      value={newUniName}
                      onChange={(e) => setNewUniName(e.target.value)}
                      placeholder="Yangi universitet to‘liq nomi *"
                      className={cn(inputCls, 'py-2.5 sm:col-span-2')}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={newUniShort}
                        onChange={(e) => setNewUniShort(e.target.value)}
                        placeholder="Qisqa (TATU)"
                        className={cn(inputCls, 'py-2.5')}
                      />
                      <select
                        value={newUniRegion}
                        onChange={(e) => setNewUniRegion(e.target.value)}
                        className={cn(inputCls, 'px-2.5 py-2.5 text-[12px]')}
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
                      disabled={savingUni || !isUniFormDirty || !newUniName.trim()}
                      className="h-10 rounded-xl bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[12.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {savingUni ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-1.5 h-4 w-4" />
                      )}
                      {savingUni ? 'Saqlanmoqda...' : 'Saqlash'}
                    </Button>
                  </form>

                  <div className="rounded-[24px] border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                    <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {alphabetSortedUniversities.map((uni, idx) => {
                        const uniName = typeof uni === 'string' ? uni : uni?.name || '';
                        const uniShort = typeof uni === 'object' ? uni?.short_name : '';
                        const uniRegion = typeof uni === 'object' ? uni?.region : '';
                        if (!uniName) return null;
                        return (
                          <li
                            key={uni?.id || `${uniName}-${idx}`}
                            className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/60"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[12.5px] font-bold text-[#08123A] dark:text-white">
                                {uniShort ? `${uniShort} — ${uniName}` : uniName}
                              </p>
                              {uniRegion && (
                                <p className="mt-0.5 text-[10.5px] font-semibold text-[#1D6FF2] dark:text-sky-400">
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
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400"
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
                  <div className="rounded-[24px] border border-slate-200/80 bg-white/95 p-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
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
                                : 'bg-slate-50/70 text-slate-600 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800'
                            )}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{reg}</span>
                            </span>
                            <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10.5px] font-extrabold dark:bg-white/10">
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
                      className="rounded-[24px] border border-[#1D6FF2]/30 bg-white/95 p-4 shadow-sm backdrop-blur-xl dark:border-sky-500/30 dark:bg-slate-900/95"
                    >
                      <p className="mb-2.5 text-[13px] font-extrabold text-[#002D96] dark:text-sky-400">
                        ➕ {activeRegionCard}ga tezkor universitet qo‘shish
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          required
                          value={newUniName}
                          onChange={(e) => setNewUniName(e.target.value)}
                          placeholder={`${activeRegionCard}dagi universitet to‘liq nomi *`}
                          className={cn(inputCls, 'flex-1')}
                        />
                        <input
                          value={newUniShort}
                          onChange={(e) => setNewUniShort(e.target.value)}
                          placeholder="Qisqa nomi"
                          className={cn(inputCls, 'w-full sm:w-36')}
                        />
                        <Button
                          type="submit"
                          disabled={savingUni || !isUniFormDirty || !newUniName.trim()}
                          className="h-10 shrink-0 rounded-xl bg-gradient-to-r from-[#002D96] to-[#1D6FF2] px-5 text-[12.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {savingUni ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Saqlash
                        </Button>
                      </div>
                    </form>

                    <div className="rounded-[24px] border border-slate-200/80 bg-white/95 p-5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                      <div className="relative mb-3.5">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={uniSearchQuery}
                          onChange={(e) => setUniSearchQuery(e.target.value)}
                          placeholder={`${activeRegionCard} universitetlari orasidan qidiring...`}
                          className={cn(inputCls, 'h-10 w-full pl-10 pr-9')}
                        />
                        {uniSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setUniSearchQuery('')}
                            aria-label="Tozalash"
                            className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {regionFilteredUniversities.length === 0 ? (
                        <p className="py-6 text-center text-[12.5px] font-bold text-slate-400">
                          Mos universitet topilmadi
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {regionFilteredUniversities.map((uni, idx) => {
                            const uniName = typeof uni === 'string' ? uni : uni?.name || '';
                            const uniShort = typeof uni === 'object' ? uni?.short_name : '';
                            return (
                              <li
                                key={uni?.id || `${uniName}-${idx}`}
                                className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/60"
                              >
                                <p className="truncate text-[13px] font-bold text-[#08123A] dark:text-white">
                                  {uniShort ? `${uniShort} — ${uniName}` : uniName}
                                </p>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const next = await api.deleteUniversity(uniName);
                                    setUniversities(Array.isArray(next) ? next.filter(Boolean) : []);
                                    toast({ title: 'Universitet o‘chirildi' });
                                  }}
                                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {uniViewMode === 'custom' && (
                <div className="rounded-[24px] border border-slate-200/80 bg-white/95 p-5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
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
                          className="flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 px-4 py-3 hover:bg-white dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:hover:bg-slate-800"
                        >
                          <div>
                            <p className="text-[13.5px] font-extrabold text-[#08123A] dark:text-white">
                              {item.cleanName}
                            </p>
                            <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
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

          {/* 5.5 XABARLAR (TALABALAR YORDAM VA SHIKOYATLARI) */}
          {effectiveSection === 'messages' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200/80 bg-white/95 p-4 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: `Barchasi (${supportMessages.length})` },
                    {
                      id: 'new',
                      label: `Yangi (${supportMessages.filter((m) => (m.status || 'new') === 'new').length})`,
                    },
                    {
                      id: 'read',
                      label: `O‘qilgan (${supportMessages.filter((m) => m.status === 'read').length})`,
                    },
                    {
                      id: 'replied',
                      label: `Javob berilgan (${supportMessages.filter((m) => m.status === 'replied').length})`,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setMsgFilterStatus(tab.id)}
                      className={cn(
                        'rounded-xl px-3 py-1.5 text-[12px] font-bold transition-all',
                        msgFilterStatus === tab.id
                          ? 'bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:text-[#002D96] dark:bg-slate-800 dark:text-slate-300 dark:hover:text-sky-300'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: 'Barcha turlar' },
                    { id: 'complaint', label: 'Shikoyat' },
                    { id: 'help', label: 'Yordam / Savol' },
                    { id: 'suggestion', label: 'Taklif' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setMsgFilterCategory(cat.id)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-[11px] font-bold transition-colors',
                        msgFilterCategory === cat.id
                          ? 'border-[#1D6FF2] bg-[#1D6FF2]/10 text-[#002D96] dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-300'
                          : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={msgSearch}
                  onChange={(e) => setMsgSearch(e.target.value)}
                  placeholder="Talaba ismi, aloqa raqami, ID yoki xabar matni bo‘yicha qidiring..."
                  className={cn(inputCls, 'h-10 w-full rounded-2xl pl-10 pr-4')}
                />
              </div>

              {filteredSupportMessages.length === 0 ? (
                <div className="rounded-[26px] border border-dashed border-slate-200 bg-white/80 py-14 text-center dark:border-slate-800 dark:bg-slate-900/70">
                  <MessageSquare className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="mt-2.5 text-[14px] font-extrabold text-[#08123A] dark:text-white">
                    Hozircha murojaatlar yo‘q
                  </p>
                  <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                    Talabalar «Yordam» yoki «Bog‘lanish» bo‘limidan yozgan barcha shikoyat va savollar shu yerda ko‘rinadi.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSupportMessages.map((msg) => {
                    const draft = msgDrafts[msg.id];
                    const curStatus = draft?.status ?? msg.status ?? 'new';
                    const curNote = draft?.admin_note ?? msg.admin_note ?? '';
                    const dirty = isMsgItemDirty(msg);
                    const cat = msg.category === 'question' ? 'help' : msg.category || 'help';
                    const catMeta =
                      cat === 'complaint'
                        ? {
                            label: 'Shikoyat',
                            cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-500/30',
                          }
                        : cat === 'suggestion'
                          ? {
                              label: 'Taklif',
                              cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-500/30',
                            }
                          : {
                              label: 'Yordam / Savol',
                              cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-500/30',
                            };

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'rounded-[24px] border bg-white/95 p-5 shadow-sm backdrop-blur-xl transition-all dark:bg-slate-900/90',
                          (msg.status || 'new') === 'new'
                            ? 'border-[#1D6FF2]/45 ring-1 ring-[#1D6FF2]/15 dark:border-sky-500/40'
                            : 'border-slate-200/80 dark:border-slate-800'
                        )}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-[14.5px] font-extrabold text-[#08123A] dark:text-white">
                                {msg.full_name || 'Foydalanuvchi'}
                              </h4>
                              {msg.student_id && (
                                <span className="rounded-full bg-[#002D96]/10 px-2.5 py-0.5 font-mono text-[10.5px] font-bold text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300">
                                  #{msg.student_id}
                                </span>
                              )}
                              <span
                                className={cn(
                                  'rounded-full border px-2.5 py-0.5 text-[10.5px] font-extrabold',
                                  catMeta.cls
                                )}
                              >
                                {catMeta.label}
                              </span>
                              {(msg.status || 'new') === 'new' && (
                                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                                  Yangi
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                              Aloqa:{' '}
                              <span className="text-[#08123A] dark:text-slate-200">
                                {msg.contact || msg.email || '—'}
                              </span>
                              {msg.email && msg.contact && msg.email !== msg.contact
                                ? ` · ${msg.email}`
                                : ''}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-400">
                              {msg.created_at
                                ? new Date(msg.created_at).toLocaleString('uz-UZ')
                                : ''}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg.id)}
                              title="O‘chirish"
                              className="grid h-8 w-8 place-items-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 text-[13px] leading-relaxed text-[#08123A] dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100">
                          {msg.message}
                        </div>

                        <div className="mt-3.5 flex flex-col gap-2.5 border-t border-slate-100 pt-3.5 dark:border-slate-800 lg:flex-row lg:items-center">
                          <div className="flex shrink-0 flex-wrap gap-1.5">
                            {[
                              { id: 'new', label: 'Yangi' },
                              { id: 'read', label: 'O‘qilgan' },
                              { id: 'replied', label: 'Javob berilgan' },
                            ].map((st) => (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => setMsgDraftField(msg, 'status', st.id)}
                                className={cn(
                                  'rounded-xl border px-3 py-1.5 text-[11.5px] font-bold transition-colors',
                                  curStatus === st.id
                                    ? st.id === 'replied'
                                      ? 'border-emerald-500 bg-emerald-500 text-white'
                                      : 'border-[#1D6FF2] bg-[#002D96] text-white'
                                    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                )}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>

                          <input
                            type="text"
                            value={curNote}
                            onChange={(e) => setMsgDraftField(msg, 'admin_note', e.target.value)}
                            placeholder="Admin izohi (masalan: Telegram orqali javob berildi)..."
                            className={cn(inputCls, 'h-9 flex-1 text-[12px]')}
                          />

                          <Button
                            type="button"
                            onClick={() => handleSaveMessage(msg)}
                            disabled={!dirty || savingMsgId === msg.id}
                            className="h-9 shrink-0 rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] px-4 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {savingMsgId === msg.id ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Saqlash
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 5.6 BILDIRISHNOMALAR (LOGIN QILGANLAR / YANGI FOYDALANUVCHILAR / IKKALASIGA HAM) */}
          {effectiveSection === 'notifications' && (
            <div className="grid gap-5 lg:grid-cols-12">
              <form
                onSubmit={handleSendBroadcastNotification}
                className="space-y-4 rounded-[26px] border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 lg:col-span-5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#1D6FF2]/10 text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[15.5px] font-extrabold text-[#08123A] dark:text-white">
                      Yangi bildirishnoma yuborish
                    </h3>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                      Ilovadagi qo‘ng‘iroqcha (bildirishnoma) oynasida darhol ko‘rinadi
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Kimga yuborilsin?
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      {
                        id: 'registered',
                        title: 'Login qilgan foydalanuvchilar',
                        desc: 'Faqat tizimga kirgan talabalarga ko‘rinadi',
                      },
                      {
                        id: 'guest',
                        title: 'Yangi foydalanuvchilar (Mehmonlar)',
                        desc: 'Faqat hali login qilmagan foydalanuvchilarga ko‘rinadi',
                      },
                      {
                        id: 'all',
                        title: 'Ikkalasiga ham (Barcha foydalanuvchilar)',
                        desc: 'Ham login qilganlarga, ham yangi foydalanuvchilarga ko‘rinadi',
                      },
                      {
                        id: 'user',
                        title: 'Aniq talabaga (Talaba ID orqali)',
                        desc: 'ID raqami orqali qidirib, faqat o‘sha foydalanuvchiga shaxsiy xabar yuborish',
                      },
                    ].map((aud) => (
                      <button
                        key={aud.id}
                        type="button"
                        onClick={() => {
                          setNotifAudience(aud.id);
                          if (aud.id !== 'user') {
                            setSelectedNotifStudent(null);
                            setNotifStudentSearch('');
                          }
                        }}
                        className={cn(
                          'flex items-start gap-2.5 rounded-2xl border p-3 text-left transition-all',
                          notifAudience === aud.id
                            ? 'border-[#1D6FF2] bg-[#1D6FF2]/10 ring-1 ring-[#1D6FF2]/25 dark:border-sky-400 dark:bg-sky-500/15'
                            : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70'
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border',
                            notifAudience === aud.id
                              ? 'border-[#1D6FF2] bg-[#1D6FF2] text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          )}
                        >
                          {notifAudience === aud.id && <Check className="h-2.5 w-2.5" />}
                        </span>
                        <div>
                          <p className="text-[12.5px] font-extrabold text-[#08123A] dark:text-white">
                            {aud.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {aud.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ANIQ TALABANI ID ORQALI QIDIRISH VA TANLASH */}
                {notifAudience === 'user' && (
                  <div className="space-y-2.5 rounded-2xl border border-[#1D6FF2]/30 bg-[#1D6FF2]/[0.05] p-3.5 dark:border-sky-500/30 dark:bg-sky-500/10">
                    <label className="block text-[11px] font-extrabold text-[#002D96] dark:text-sky-300">
                      Talaba ID raqamini yozing va tanlang *
                    </label>

                    {selectedNotifStudent ? (
                      <div className="flex items-center justify-between gap-2.5 rounded-xl border border-emerald-200 bg-white px-3 py-2.5 shadow-xs dark:border-emerald-500/35 dark:bg-slate-900">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[13px] font-extrabold text-[#08123A] dark:text-white">
                              {selectedNotifStudent.name}
                            </p>
                            <span className="shrink-0 rounded-full bg-[#002D96]/10 px-2 py-0.5 font-mono text-[10.5px] font-extrabold text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300">
                              #{selectedNotifStudent.student_id}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {selectedNotifStudent.university ||
                              selectedNotifStudent.email ||
                              selectedNotifStudent.phone ||
                              'Talaba'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedNotifStudent(null)}
                          title="Boshqa talaba tanlash"
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1D6FF2] dark:text-sky-400" />
                          <input
                            type="text"
                            value={notifStudentSearch}
                            onChange={(e) => setNotifStudentSearch(e.target.value)}
                            placeholder="Masalan: 482910 yoki ism familiya..."
                            className={cn(inputCls, 'w-full pl-9 py-2')}
                          />
                        </div>

                        <div className="max-h-48 space-y-1 overflow-y-auto pr-0.5">
                          {notifMatchedStudents.length === 0 ? (
                            <p className="py-3 text-center text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
                              Bunday ID yoki ismli talaba topilmadi
                            </p>
                          ) : (
                            notifMatchedStudents.map((stu) => (
                              <button
                                key={stu.id}
                                type="button"
                                onClick={() => setSelectedNotifStudent(stu)}
                                className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-left transition-colors hover:border-[#1D6FF2] hover:bg-[#1D6FF2]/[0.04] dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-400"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-[12.5px] font-extrabold text-[#08123A] dark:text-white">
                                    {stu.name || 'Talaba'}
                                  </p>
                                  <p className="truncate text-[10.5px] text-slate-500 dark:text-slate-400">
                                    {stu.email || stu.phone || stu.university || '—'}
                                  </p>
                                </div>
                                <span className="shrink-0 rounded-full bg-[#002D96]/10 px-2.5 py-0.5 font-mono text-[11px] font-extrabold text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300">
                                  #{stu.student_id}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Xabar turi
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'info', label: 'Yangilik' },
                      { id: 'promo', label: 'Aksiya' },
                      { id: 'alert', label: 'Muhim' },
                    ].map((tone) => (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => setNotifTone(tone.id)}
                        className={cn(
                          'rounded-xl border py-2 text-[12px] font-bold transition-colors',
                          notifTone === tone.id
                            ? tone.id === 'alert'
                              ? 'border-amber-500 bg-amber-500 text-white'
                              : tone.id === 'promo'
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-[#1D6FF2] bg-[#002D96] text-white'
                            : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        )}
                      >
                        {tone.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Sarlavha *
                  </label>
                  <input
                    required
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Masalan: Yangi 30% talaba chegirmasi qo‘shildi!"
                    className={cn(inputCls, 'w-full py-2.5')}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Xabar matni *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Foydalanuvchilar ko‘radigan batafsil xabar matnini yozing..."
                    className={cn(inputCls, 'w-full resize-none py-2.5')}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={
                    sendingNotif ||
                    !notifTitle.trim() ||
                    !notifMessage.trim() ||
                    (notifAudience === 'user' && !selectedNotifStudent)
                  }
                  className="h-11 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {sendingNotif ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Yuborilmoqda...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Bildirishnomani yuborish
                    </>
                  )}
                </Button>
              </form>

              <div className="space-y-3.5 rounded-[26px] border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 lg:col-span-7">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-[#08123A] dark:text-white">
                    <Bell className="h-4 w-4 text-[#1D6FF2] dark:text-sky-400" />
                    Yuborilgan bildirishnomalar ({broadcastNotifications.length})
                  </h3>

                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: 'all', label: 'Barchasi' },
                      { id: 'user', label: 'Shaxsiy (ID)' },
                      { id: 'registered', label: 'Login qilganlar' },
                      { id: 'guest', label: 'Yangi userlar' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setNotifFilterAudience(f.id)}
                        className={cn(
                          'rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors',
                          notifFilterAudience === f.id
                            ? 'bg-[#002D96] text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredBroadcastNotifications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center dark:border-slate-700">
                    <Bell className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-[13px] font-bold text-slate-500 dark:text-slate-400">
                      Hozircha yuborilgan bildirishnoma yo‘q
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {filteredBroadcastNotifications.map((n) => {
                      const audBadge =
                        n.audience === 'user'
                          ? {
                              label: `Shaxsiy · ${n.target_name || 'Talaba'} (#${n.target_student_id || '—'})`,
                              cls: 'bg-violet-50 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
                            }
                          : n.audience === 'registered'
                            ? {
                                label: 'Login qilganlar',
                                cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
                              }
                            : n.audience === 'guest'
                              ? {
                                  label: 'Yangi foydalanuvchilar',
                                  cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
                                }
                              : {
                                  label: 'Ikkalasiga ham (Barchaga)',
                                  cls: 'bg-[#1D6FF2]/10 text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300',
                                };

                      return (
                        <li
                          key={n.id}
                          className="rounded-2xl border border-slate-100 bg-slate-50/75 p-4 dark:border-slate-800 dark:bg-slate-800/60"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={cn(
                                    'h-2.5 w-2.5 shrink-0 rounded-full',
                                    n.tone === 'alert'
                                      ? 'bg-amber-500'
                                      : n.tone === 'promo'
                                        ? 'bg-emerald-500'
                                        : 'bg-[#1D6FF2]'
                                  )}
                                />
                                <p className="text-[13.5px] font-extrabold text-[#08123A] dark:text-white">
                                  {n.title}
                                </p>
                              </div>
                              <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                                {n.message}
                              </p>
                              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                <span
                                  className={cn(
                                    'rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold',
                                    audBadge.cls
                                  )}
                                >
                                  {audBadge.label}
                                </span>
                                <span className="text-[10.5px] font-semibold text-slate-400">
                                  {n.created_at
                                    ? new Date(n.created_at).toLocaleString('uz-UZ')
                                    : ''}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteBroadcastNotification(n.id)}
                              title="O‘chirish"
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* 6. ADMINLAR VA HUQUQLAR (DIRTY-STATE SAQLASH TUGMASI) */}
          {effectiveSection === 'admins' && session.isSuper && (
            <div className="grid gap-4 lg:grid-cols-2">
              <form
                onSubmit={handleAddAdmin}
                className="space-y-3.5 rounded-[26px] border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90"
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-[#002D96] dark:text-sky-400" />
                  <h3 className="text-[15px] font-extrabold text-[#08123A] dark:text-white">
                    Yangi admin qo‘shish va ruxsatlarni belgilash
                  </h3>
                </div>

                <div className="space-y-2.5">
                  <input
                    required
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    placeholder="Admin ismi va familiyasi"
                    className={cn(inputCls, 'w-full py-2.5')}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      required
                      value={newAdminLogin}
                      onChange={(e) => setNewAdminLogin(e.target.value)}
                      placeholder="Login"
                      className={cn(inputCls, 'w-full py-2.5')}
                    />
                    <input
                      required
                      type="password"
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      placeholder="Parol"
                      className={cn(inputCls, 'w-full py-2.5')}
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
                            ? 'border-[#1D6FF2] bg-[#1D6FF2]/10 text-[#002D96] dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-300'
                            : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        )}
                      >
                        <span
                          className={cn(
                            'grid h-4 w-4 place-items-center rounded border',
                            checked
                              ? 'border-[#1D6FF2] bg-[#1D6FF2] text-white'
                              : 'border-slate-300 dark:border-slate-600'
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
                  disabled={
                    savingNewAdmin ||
                    !isNewAdminDirty ||
                    !newAdminName.trim() ||
                    !newAdminLogin.trim() ||
                    !newAdminPass.trim()
                  }
                  className="h-10 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[12.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {savingNewAdmin ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    <>
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                      Saqlash
                    </>
                  )}
                </Button>
              </form>

              <div className="space-y-3 rounded-[26px] border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-extrabold text-[#08123A] dark:text-white">
                    Mavjud adminlar ({admins.length})
                  </h3>
                  <Button
                    type="button"
                    onClick={handleSaveAdminPerms}
                    disabled={savingAdminPerms || !isAdminPermsDirty}
                    className="h-8 rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] px-4 text-[11.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {savingAdminPerms ? (
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="mr-1.5 h-3 w-3" />
                    )}
                    Saqlash
                  </Button>
                </div>

                <ul className="space-y-3">
                  {admins.map((adm) => {
                    const effectivePerms = Array.isArray(draftAdminPerms[adm.login])
                      ? draftAdminPerms[adm.login]
                      : adm.permissions || [];
                    return (
                      <li
                        key={adm.id || adm.login}
                        className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/60"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[13.5px] font-extrabold text-[#08123A] dark:text-white">
                              {adm.name}
                            </p>
                            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              Login: {adm.login}
                            </p>
                          </div>
                          {!adm.isSuper && adm.id !== session.id && (
                            <button
                              type="button"
                              onClick={async () => {
                                await api.deleteAdmin(adm.id);
                                setAdmins(await api.listAdmins());
                                toast({ title: 'Admin o‘chirildi' });
                              }}
                              className="grid h-8 w-8 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {!adm.isSuper && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-slate-200/60 pt-2.5 dark:border-slate-700">
                            {(ADMIN_PERMISSION_LIST || []).map((perm) => {
                              const hasPerm = effectivePerms.includes(perm.id);
                              return (
                                <button
                                  key={perm.id}
                                  type="button"
                                  onClick={() => handleToggleExistingAdminPerm(adm, perm.id)}
                                  className={cn(
                                    'rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition-colors',
                                    hasPerm
                                      ? 'border-[#1D6FF2] bg-[#002D96] text-white'
                                      : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
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
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {/* 7. SOZLAMALAR (GLOBAL SAYT KONFIGURATSIYASI — 3 TA BLOK + SAQLASH TUGMASI) */}
          {effectiveSection === 'settings' && (
            <form onSubmit={handleSaveSiteSettings} className="space-y-5">
              {/* 1-BLOK: OGOHLANTIRISH BANNERI (TEST REJIMI) */}
              <div className="rounded-[26px] border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-[15.5px] font-extrabold text-[#08123A] dark:text-white">
                        1. Ogohlantirish banneri (Test rejimi)
                      </h3>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400">
                        Sayt va admin panel tepasidagi sariq ogohlantirish lentasini boshqarish
                      </p>
                    </div>
                  </div>

                  {/* TOGGLE SWITCH: show_test_banner */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(siteSettings.show_test_banner)}
                    onClick={() =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        show_test_banner: !prev.show_test_banner,
                      }))
                    }
                    className={cn(
                      'inline-flex items-center gap-2.5 rounded-full border px-3.5 py-2 text-[12px] font-extrabold transition-all',
                      siteSettings.show_test_banner
                        ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300'
                        : 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    )}
                  >
                    <span>{siteSettings.show_test_banner ? 'Yoqilgan' : 'O‘chirilgan'}</span>
                    <span
                      className={cn(
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                        siteSettings.show_test_banner
                          ? 'bg-amber-500'
                          : 'bg-slate-300 dark:bg-slate-600'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                          siteSettings.show_test_banner ? 'translate-x-4' : 'translate-x-0.5'
                        )}
                      />
                    </span>
                  </button>
                </div>

                <div className="mt-4 space-y-2.5">
                  <label className="block text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                    Banner matni
                  </label>
                  <input
                    type="text"
                    value={siteSettings.test_banner_text}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({ ...prev, test_banner_text: e.target.value }))
                    }
                    placeholder="Diqqat: Sayt hozirda test rejimida ishlamoqda, hech qaysi aksiya va chegirmalar hozircha faol emas."
                    className={cn(inputCls, 'w-full py-2.5')}
                  />
                  {siteSettings.show_test_banner ? (
                    <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-3.5 py-2 text-[11.5px] font-bold text-white shadow-xs">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-100" />
                      <span className="truncate">
                        {siteSettings.test_banner_text.trim() ||
                          'Diqqat: Sayt hozirda test rejimida ishlamoqda, hech qaysi aksiya va chegirmalar hozircha faol emas.'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11.5px] font-semibold text-slate-400">
                      Saqlangach, sariq test rejimi banneri asosiy saytdan ham, admin paneldan ham butunlay olib tashlanadi.
                    </p>
                  )}
                </div>
              </div>

              {/* 2-BLOK: IJTIMOIY TARMOQLAR VA ALOQA */}
              <div className="rounded-[26px] border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#1D6FF2]/10 text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[15.5px] font-extrabold text-[#08123A] dark:text-white">
                      2. Ijtimoiy tarmoqlar va aloqa
                    </h3>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">
                      Footer va «Bog‘lanish» sahifasida avtomatik yangilanadi. Bo‘sh qoldirilgan tarmoqlar saytda ko‘rinmaydi.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                      <Send className="h-3.5 w-3.5 text-[#0088CC]" />
                      Telegram havola yoki @username
                    </label>
                    <input
                      type="text"
                      value={siteSettings.telegram_url}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({ ...prev, telegram_url: e.target.value }))
                      }
                      placeholder="https://t.me/imtiyosupport_bot"
                      className={cn(inputCls, 'w-full py-2.5')}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                      <Instagram className="h-3.5 w-3.5 text-pink-500" />
                      Instagram havola
                    </label>
                    <input
                      type="text"
                      value={siteSettings.instagram_url}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({ ...prev, instagram_url: e.target.value }))
                      }
                      placeholder="https://instagram.com/imtiyo.uz"
                      className={cn(inputCls, 'w-full py-2.5')}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                      <Youtube className="h-3.5 w-3.5 text-red-500" />
                      YouTube havola
                    </label>
                    <input
                      type="text"
                      value={siteSettings.youtube_url}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({ ...prev, youtube_url: e.target.value }))
                      }
                      placeholder="https://youtube.com/@imtiyo"
                      className={cn(inputCls, 'w-full py-2.5')}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                      <Phone className="h-3.5 w-3.5 text-emerald-500" />
                      Aloqa telefoni
                    </label>
                    <input
                      type="text"
                      value={siteSettings.contact_phone}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({ ...prev, contact_phone: e.target.value }))
                      }
                      placeholder="+998 (71) 200-00-00"
                      className={cn(inputCls, 'w-full py-2.5')}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                      <Mail className="h-3.5 w-3.5 text-[#1D6FF2]" />
                      Elektron pochta (Email)
                    </label>
                    <input
                      type="email"
                      value={siteSettings.contact_email}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({ ...prev, contact_email: e.target.value }))
                      }
                      placeholder="info@imtiyo.uz"
                      className={cn(inputCls, 'w-full py-2.5')}
                    />
                  </div>
                </div>
              </div>

              {/* 3-BLOK: SAYT ASOSIY MATNLARI (HERO TITLE & SUBTITLE) */}
              <div className="rounded-[26px] border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                    <Type className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[15.5px] font-extrabold text-[#08123A] dark:text-white">
                      3. Sayt asosiy matnlari
                    </h3>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">
                      Bosh sahifadagi asosiy sarlavha va qisqa tavsif (bo‘sh qoldirilsa standart matn ko‘rinadi)
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3.5">
                  <div>
                    <label className="mb-1.5 block text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                      Bosh sahifa sarlavhasi (Hero Title)
                    </label>
                    <input
                      type="text"
                      value={siteSettings.hero_title}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({ ...prev, hero_title: e.target.value }))
                      }
                      placeholder="Masalan: Talabalar uchun eksklyuziv chegirmalar"
                      className={cn(inputCls, 'w-full py-2.5')}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                      Qisqa tavsif (Hero Subtitle)
                    </label>
                    <textarea
                      rows={3}
                      value={siteSettings.hero_subtitle}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({ ...prev, hero_subtitle: e.target.value }))
                      }
                      placeholder="Masalan: Eng so‘nggi talaba chegirmalari va imtiyozlarini o‘tkazib yubormang — har kuni yangilanadi!"
                      className={cn(inputCls, 'w-full resize-none py-2.5')}
                    />
                  </div>
                </div>
              </div>

              {/* PASTKI UMUMIY SAQLASH PANELI */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200/80 bg-white/95 px-5 py-4 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                <p className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400">
                  {isSiteSettingsDirty
                    ? 'Saqlanmagan o‘zgarishlar mavjud — ularni tasdiqlash uchun «Saqlash» ni bosing.'
                    : 'Barcha sozlamalar saqlangan.'}
                </p>
                <div className="flex items-center gap-2">
                  {isSiteSettingsDirty && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSiteSettings(savedSiteSettings)}
                      className="h-10 rounded-full px-4 text-[12.5px] font-bold dark:border-slate-700 dark:text-slate-200"
                    >
                      Bekor qilish
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={savingSiteSettings || !isSiteSettingsDirty}
                    className="h-10 rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] px-6 text-[13px] font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {savingSiteSettings ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saqlanmoqda...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Saqlash
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </main>
      </div>

      {/* TALABA YOZGAN UNIVERSITETNI TASDIQLASH MODALI */}
      {approvingCustomUni && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#08123A]/60 p-4 backdrop-blur-sm"
          onClick={() => setApprovingCustomUni(null)}
        >
          <form
            onSubmit={handleConfirmApproveCustomUni}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-3.5 rounded-[28px] border border-white/80 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <h3 className="text-[16px] font-extrabold text-[#08123A] dark:text-white">
              Universitetni bazaga qo‘shish
            </h3>
            <input
              required
              value={customApproveName}
              onChange={(e) => setCustomApproveName(e.target.value)}
              className={cn(inputCls, 'w-full py-2.5 text-[13px] font-bold')}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={customApproveShort}
                onChange={(e) => setCustomApproveShort(e.target.value)}
                placeholder="Qisqa nomi"
                className={cn(inputCls, 'w-full')}
              />
              <RegionSelect
                value={customApproveRegion}
                onChange={setCustomApproveRegion}
                compact
                showIcon={false}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setApprovingCustomUni(null)}
                className="h-10 flex-1 rounded-full dark:border-slate-700 dark:text-slate-200"
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={savingCustomUni || !customApproveName.trim()}
                className="h-10 flex-1 rounded-full bg-[#002D96] text-white"
              >
                {savingCustomUni ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-4 w-4" />
                )}
                Saqlash
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TALABA DETAL MODALI (STATUS, KURS VA IZOHNI SAQLASH TUGMASI BILAN) */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#08123A]/60 p-4 backdrop-blur-sm"
          onClick={closeStudentModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[28px] border border-white/80 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[17px] font-extrabold text-[#08123A] dark:text-white">
                    {selectedStudent.name}
                  </p>
                  <VerificationPill status={selectedStudent.status} />
                </div>
                <p className="mt-0.5 font-mono text-[11.5px] font-bold text-[#1D6FF2] dark:text-sky-400">
                  Talaba ID: #{selectedStudent.student_id}
                </p>
              </div>
              <button
                type="button"
                onClick={closeStudentModal}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3.5 grid grid-cols-1 gap-2 text-[12px] sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/70">
                <span className="block text-[10.5px] font-bold uppercase text-slate-400">
                  Aloqa
                </span>
                <span className="font-bold text-[#08123A] dark:text-white">
                  {selectedStudent.phone || selectedStudent.email || '—'}
                </span>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/70">
                <span className="block text-[10.5px] font-bold uppercase text-slate-400">
                  Viloyat
                </span>
                <span className="font-bold text-[#08123A] dark:text-white">
                  {selectedStudent.region || '—'}
                </span>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/70">
                <span className="block text-[10.5px] font-bold uppercase text-slate-400">
                  Ta’lim muassasasi
                </span>
                <span className="font-bold text-[#08123A] dark:text-white">
                  {selectedStudent.university || '—'}
                </span>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/70">
                <span className="block text-[10.5px] font-bold uppercase text-slate-400">
                  Kurs
                </span>
                <select
                  value={studentDraftCourse}
                  onChange={(e) => setStudentDraftCourse(e.target.value)}
                  className="mt-0.5 w-full bg-transparent text-[12.5px] font-bold text-[#1D6FF2] outline-none dark:text-sky-400"
                >
                  <option value="">Kiritilmagan</option>
                  {COURSE_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}-kurs
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedStudent.document_url ? (
              <button
                type="button"
                onClick={() => setPreviewDocPerson(selectedStudent)}
                className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#1D6FF2]/40 bg-[#1D6FF2]/10 py-2.5 text-[12.5px] font-extrabold text-[#002D96] dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300"
              >
                <Eye className="h-4 w-4" />
                Hujjatni brauzerda ko‘rish ({selectedStudent.document_name || 'Fayl'})
              </button>
            ) : (
              <div className="mt-3.5 rounded-2xl border border-dashed border-slate-200 py-3 text-center text-[12px] font-semibold text-slate-400 dark:border-slate-700">
                Talaba hali tasdiqlovchi hujjat yuklamagan (Hujjatsiz)
              </div>
            )}

            {/* STATUS TAHRIRLASH + SAQLASH TUGMASI */}
            <div className="mt-4 space-y-3 border-t border-slate-100 pt-3.5 dark:border-slate-800">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Talabalik statusi
                </label>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {[
                    { id: 'pending', label: 'Kutilmoqda' },
                    { id: 'verified', label: 'Tasdiqlangan' },
                    { id: 'rejected', label: 'Rad etilgan' },
                    { id: 'unverified', label: 'Hujjatsiz' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStudentDraftStatus(st.id)}
                      className={cn(
                        'rounded-xl border py-2 text-[11.5px] font-bold transition-all',
                        studentDraftStatus === st.id
                          ? st.id === 'verified'
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : st.id === 'rejected'
                              ? 'border-rose-500 bg-rose-500 text-white'
                              : 'border-[#1D6FF2] bg-[#002D96] text-white'
                          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      )}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {studentDraftStatus === 'rejected' && (
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    Rad etish sababi *
                  </label>
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Masalan: Hujjat xira yoki muddati o‘tgan"
                    className={cn(inputCls, 'w-full border-rose-200 dark:border-rose-500/40')}
                  />
                </div>
              )}

              <Button
                type="button"
                onClick={handleSaveStudentChanges}
                disabled={busyId === selectedStudent.id || !isStudentModalDirty}
                className="h-10 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[12.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                {busyId === selectedStudent.id ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Saqlanmoqda...
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-4 w-4" />
                    Saqlash
                  </>
                )}
              </Button>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3.5 dark:border-slate-800">
              <p className="mb-2 flex items-center gap-1.5 text-[12px] font-extrabold text-[#08123A] dark:text-white">
                <Ticket className="h-3.5 w-3.5 text-[#1D6FF2] dark:text-sky-400" />
                Foydalanilgan aksiyalar ({selectedStudentDeals.length})
              </p>
              {selectedStudentDeals.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 py-3 text-center text-[11.5px] text-slate-400 dark:border-slate-700">
                  Hali chegirma ishlatmagan
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {selectedStudentDeals.map((deal) => (
                    <li
                      key={deal.id}
                      className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[12px] dark:border-slate-800 dark:bg-slate-800/70"
                    >
                      <div className="flex justify-between">
                        <span className="font-bold text-[#08123A] dark:text-white">
                          {deal.brand_name}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-[#1D6FF2] dark:text-sky-400">
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#08123A]/75 p-4 backdrop-blur-sm"
          onClick={() => setPreviewDocPerson(null)}
        >
          <div
            className="flex h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
              <h3 className="text-[15px] font-extrabold text-[#08123A] dark:text-white">
                {previewDocPerson.name} — {previewDocPerson.document_name || 'Hujjat'}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewDocPerson.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-[11.5px] font-bold text-[#002D96] dark:bg-slate-800 dark:text-sky-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Yangi oynada
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDocPerson(null)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
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

      {/* SAQLANMAGAN O'ZGARISHLAR OGOHLANTIRISH MODALI */}
      {pendingNavAction && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#08123A]/60 p-4 backdrop-blur-sm"
          onClick={() => setPendingNavAction(null)}
        >
          <div
            className="w-full max-w-sm rounded-[26px] border border-white/80 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h3 className="text-[16px] font-extrabold text-[#08123A] dark:text-white">
                Saqlanmagan o‘zgarishlar bor
              </h3>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
              Kiritilgan o‘zgarishlar hali saqlanmadi. Boshqa bo‘limga o‘tsangiz, ular yo‘qoladi.
              Davom etasizmi?
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setPendingNavAction(null)}
                className="flex-1 rounded-full border border-slate-200 bg-white py-2.5 text-[12.5px] font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Qolish
              </button>
              <button
                type="button"
                onClick={() => {
                  const fn = pendingNavAction;
                  setPendingNavAction(null);
                  clearAllDirtyDrafts();
                  fn();
                }}
                className="flex-1 rounded-full bg-amber-500 py-2.5 text-[12.5px] font-bold text-white hover:bg-amber-600"
              >
                Chiqish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHIQISHNI TASDIQLASH MODALI */}
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
              Haqiqatan ham admin paneldan chiqmoqchimisiz?
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-full border border-slate-200 bg-white py-2.5 text-[12.5px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Yo‘q
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 rounded-full bg-rose-500 py-2.5 text-[12.5px] font-bold text-white hover:bg-rose-600"
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
