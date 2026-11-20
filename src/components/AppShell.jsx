import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Heart,
  HelpCircle,
  Info,
  Instagram,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Star,
  Ticket,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import Logo from '@/components/Logo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import VerifyModal from '@/components/VerifyModal';
import PageTopGradient from '@/components/PageTopGradient';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import AuthPromptCardModal from '@/components/AuthPromptCardModal';
import MobileBottomDock from '@/components/MobileBottomDock';
import { useLang } from '@/lib/LanguageContext';
import { useStudent } from '@/lib/StudentContext';
import { useScrollLock } from '@/lib/useScrollLock';
import { api } from '@/services/api';
import { brands as sampleBrands, offers as sampleOffers } from '@/data/mockData';
import { cn } from '@/lib/utils';

const READ_NOTIFS_KEY = 'imtiyo_read_notifications_v1';
const DISMISSED_REJECT_BANNER_KEY = 'imtiyo_dismissed_reject_banner_v1';

function readStringSet(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeStringSet(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify([...new Set(list.map(String))]));
  } catch {
    /* ignore */
  }
}

export function openAuthPromptModal(reason = 'default') {
  window.dispatchEvent(new CustomEvent('imtiyo_open_auth_modal', { detail: { reason } }));
}

export default function AppShell({
  children,
  hideSearch = false,
  breadcrumbs = null,
  showImtiyoAbout = false,
  showAppPromo = false,
}) {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { profile, signOut } = useStudent();

  const [allBrands, setAllBrands] = useState([]);
  const [allOffers, setAllOffers] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const [likedIds, setLikedIds] = useState(() => api.getLikedIds());
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const [savedItems, setSavedItems] = useState([]);

  const [notifOpen, setNotifOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState(() => readStringSet(READ_NOTIFS_KEY));
  const [dismissedRejectKey, setDismissedRejectKey] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_REJECT_BANNER_KEY) || '';
    } catch {
      return '';
    }
  });

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState('default');
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  useScrollLock(savedModalOpen || showLogoutConfirm);

  const searchWrapRef = useRef(null);
  const mobileSearchWrapRef = useRef(null);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const loadBroadcasts = useCallback(() => {
    api
      .listBroadcastNotifications()
      .then((list) => setBroadcasts(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.listBrands().catch(() => sampleBrands),
      api.listAllOffers().catch(() => sampleOffers),
    ]).then(([bList, oList]) => {
      if (!active) return;
      setAllBrands(Array.isArray(bList) && bList.length ? bList : sampleBrands);
      setAllOffers(Array.isArray(oList) && oList.length ? oList : sampleOffers);
    });
    loadBroadcasts();

    const onNotifsChanged = () => loadBroadcasts();
    const onStorage = (e) => {
      if (e.key === 'imtiyo_broadcast_notifications_v1' || e.key === null) {
        loadBroadcasts();
      }
    };
    window.addEventListener('imtiyo_notifications_changed', onNotifsChanged);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onNotifsChanged);

    return () => {
      active = false;
      window.removeEventListener('imtiyo_notifications_changed', onNotifsChanged);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onNotifsChanged);
    };
  }, [loadBroadcasts]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = allBrands.map((b) => {
      const bOffer = allOffers.find((o) => String(o.brand_id) === String(b.id));
      const offerText =
        bOffer?.title_uz ||
        bOffer?.title?.uz ||
        b.tagline?.uz ||
        `${b.discount} talaba chegirmasi`;
      return {
        id: b.id,
        name: b.name,
        subtitle: offerText,
        discount: b.discount,
        logo_url: b.logo_url,
        monogram: b.monogram || (b.name || 'I').slice(0, 2).toUpperCase(),
        accent: b.accent || '#002D96',
        category: b.category || '',
      };
    });

    if (!q) return list.slice(0, 7);
    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.discount || '').toLowerCase().includes(q)
    );
  }, [allBrands, allOffers, searchQuery]);

  const refreshLikes = useCallback(async () => {
    const rawIds = api.getLikedIds();
    const ids = (Array.isArray(rawIds) ? rawIds : [])
      .map((x) => String(x).trim())
      .filter(Boolean);
    setLikedIds(ids);

    if (ids.length === 0) {
      setSavedItems([]);
      return;
    }

    try {
      const [apiBrands, apiOffers] = await Promise.all([
        allBrands.length ? Promise.resolve(allBrands) : api.listBrands().catch(() => []),
        allOffers.length ? Promise.resolve(allOffers) : api.listAllOffers().catch(() => []),
      ]);

      const mergedBrands = [...(apiBrands || []), ...(sampleBrands || [])];
      const mergedOffers = [...(apiOffers || []), ...(sampleOffers || [])];

      const resolved = [];
      const seenLikeIds = new Set();

      ids.forEach((rawId) => {
        if (seenLikeIds.has(rawId)) return;
        const isExplicitOffer = rawId.startsWith('offer:');
        const isExplicitBrand = rawId.startsWith('brand:') || rawId.startsWith('brand-');
        const cleanId = rawId.replace(/^(brand[-:]|offer:)/, '');

        // 1. Avval individual chegirmalarni (offer) tekshirish
        if (!isExplicitBrand) {
          const matchedOffer = mergedOffers.find(
            (o) => String(o.id) === rawId || String(o.id) === cleanId
          );
          if (matchedOffer) {
            seenLikeIds.add(rawId);
            const parentBrand = mergedBrands.find(
              (b) => String(b.id) === String(matchedOffer.brand_id)
            );
            resolved.push({
              likeId: rawId,
              kind: 'offer',
              offerId: matchedOffer.id,
              title:
                matchedOffer.title_uz ||
                matchedOffer.title?.uz ||
                matchedOffer.brand_name ||
                parentBrand?.name ||
                'Maxsus chegirma',
              subtitle: matchedOffer.brand_name || parentBrand?.name || 'Aksiya',
              discount:
                matchedOffer.discount ||
                matchedOffer.discount_label ||
                parentBrand?.discount ||
                '-15%',
              slug: matchedOffer.brand_id || parentBrand?.id || '',
              logo_url: parentBrand?.logo_url || '',
              accent: parentBrand?.accent || '#1D6FF2',
              monogram:
                parentBrand?.monogram ||
                (matchedOffer.brand_name || 'A').slice(0, 2).toUpperCase(),
            });
            return;
          }

          // Agar default-<brandId> chegirmasi bo'lsa
          if (cleanId.startsWith('default-')) {
            const targetBrandId = cleanId.replace(/^default-/, '');
            const parentBrand = mergedBrands.find(
              (b) => String(b.id) === targetBrandId || String(b.slug || '') === targetBrandId
            );
            if (parentBrand) {
              seenLikeIds.add(rawId);
              resolved.push({
                likeId: rawId,
                kind: 'offer',
                offerId: cleanId,
                title:
                  parentBrand.tagline?.uz ||
                  parentBrand.tagline_uz ||
                  `${parentBrand.name} talaba chegirmasi`,
                subtitle: parentBrand.name,
                discount: parentBrand.discount || parentBrand.discount_label || '-20%',
                slug: parentBrand.id || parentBrand.slug,
                logo_url: parentBrand.logo_url || '',
                accent: parentBrand.accent || '#002D96',
                monogram:
                  parentBrand.monogram || (parentBrand.name || 'I').slice(0, 2).toUpperCase(),
              });
              return;
            }
          }
        }

        // 2. Keyin brend darajasidagi saqlanganlarni tekshirish
        if (!isExplicitOffer) {
          const matchedBrand = mergedBrands.find(
            (b) =>
              String(b.id) === rawId ||
              String(b.id) === cleanId ||
              String(b.slug || '') === cleanId ||
              String(b.recordId || '') === rawId
          );

          if (matchedBrand) {
            seenLikeIds.add(rawId);
            resolved.push({
              likeId: rawId,
              kind: 'brand',
              title: matchedBrand.name,
              subtitle:
                matchedBrand.tagline?.uz ||
                matchedBrand.tagline_uz ||
                matchedBrand.category ||
                'Hamkor brend',
              discount: matchedBrand.discount || matchedBrand.discount_label || '-20%',
              slug: matchedBrand.id || matchedBrand.slug,
              logo_url: matchedBrand.logo_url || '',
              accent: matchedBrand.accent || matchedBrand.accent_color || '#002D96',
              monogram:
                matchedBrand.monogram || (matchedBrand.name || 'I').slice(0, 2).toUpperCase(),
            });
            return;
          }
        }

        seenLikeIds.add(rawId);
        resolved.push({
          likeId: rawId,
          kind: isExplicitOffer ? 'offer' : 'brand',
          title: cleanId.toUpperCase(),
          subtitle: 'Saqlangan chegirma',
          discount: 'Maxsus taklif',
          slug: cleanId,
          accent: '#002D96',
          monogram: (cleanId[0] || 'I').toUpperCase(),
        });
      });

      setSavedItems(resolved);
    } catch {
      /* ignore */
    }
  }, [allBrands, allOffers]);

  useEffect(() => {
    refreshLikes();
    window.addEventListener('imtiyo_likes_changed', refreshLikes);
    return () => window.removeEventListener('imtiyo_likes_changed', refreshLikes);
  }, [refreshLikes]);

  useEffect(() => {
    const handleOpenAuth = (e) => {
      if (!profile?.signedIn || profile?.status !== 'verified') {
        setAuthPromptReason(e?.detail?.reason || 'default');
        setAuthPromptOpen(true);
      }
    };
    window.addEventListener('imtiyo_open_auth_modal', handleOpenAuth);
    return () => window.removeEventListener('imtiyo_open_auth_modal', handleOpenAuth);
  }, [profile?.signedIn, profile?.status]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const inDesktopSearch = searchWrapRef.current?.contains(e.target);
      const inMobileSearch = mobileSearchWrapRef.current?.contains(e.target);
      if (!inDesktopSearch && !inMobileSearch) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = useMemo(() => {
    const list = [];
    const isSignedIn = Boolean(profile?.signedIn);

    // 1. Talabalik statusi bildirishnomasi (admin ismi studentga ko'rsatilmaydi)
    if (isSignedIn) {
      if (profile.status === 'rejected') {
        const reasonText =
          (profile.rejection_reason || '').trim() || t('notif.rejectedFallback');
        list.push({
          id: `status-rejected:${profile.id}:${reasonText}:${profile.reviewed_at || ''}`,
          type: 'rejected',
          title: t('notif.rejectedTitle'),
          desc: `${t('notif.rejectedReasonPrefix')} «${reasonText}»`,
          time: t('common.new'),
          actionLabel: t('notif.reupload'),
          actionType: 'reupload',
        });
      } else if (profile.status === 'verified') {
        list.push({
          id: `status-verified:${profile.id}:${profile.reviewed_at || ''}`,
          type: 'verified',
          title: t('notif.verifiedTitle'),
          desc: t('notif.verifiedDesc'),
          time: t('common.active'),
        });
      } else if (profile.status === 'pending') {
        list.push({
          id: `status-pending:${profile.id}:${profile.submitted_date || ''}`,
          type: 'pending',
          title: t('notif.pendingTitle'),
          desc: t('notif.pendingDesc'),
          time: t('notif.inProgress'),
        });
      }
    }

    // 2. Admin tomonidan yuborilgan maqsadli (registered / guest / all) bildirishnomalar
    broadcasts.forEach((b) => {
      if (!b || !b.title) return;
      const aud = b.audience || 'all';
      const matchesAudience =
        aud === 'all' ||
        (aud === 'registered' && isSignedIn) ||
        (aud === 'guest' && !isSignedIn);
      if (!matchesAudience) return;
      const dateStr = b.created_at
        ? new Date(b.created_at).toLocaleDateString(
            lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ',
            { day: '2-digit', month: 'short' }
          )
        : t('notif.today');
      list.push({
        id: `broadcast:${b.id}`,
        type: b.tone === 'alert' ? 'rejected' : b.tone === 'promo' ? 'broadcast' : 'broadcast',
        title: b.title,
        desc: b.message,
        time: dateStr,
      });
    });

    // 3. Asosiy tizim bildirishnomalari
    list.push(
      {
        id: 'n-welcome',
        type: 'info',
        title: t('notif.welcomeTitle'),
        desc: t('notif.welcomeDesc'),
        time: t('notif.today'),
      },
      {
        id: 'n-partners',
        type: 'info',
        title: t('notif.partnersTitle'),
        desc: t('notif.partnersDesc'),
        time: t('notif.yesterday'),
      }
    );

    return list.map((item) => ({
      ...item,
      unread: !readNotifIds.includes(item.id),
    }));
  }, [
    profile?.signedIn,
    profile?.id,
    profile?.status,
    profile?.rejection_reason,
    profile?.reviewed_at,
    profile?.submitted_date,
    broadcasts,
    readNotifIds,
    lang,
    t,
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const hasUnreadRejection = notifications.some((n) => n.type === 'rejected' && n.unread);

  const rejectionBannerKey =
    profile?.signedIn && profile?.status === 'rejected'
      ? `${profile.id}:${profile.rejection_reason || ''}:${profile.reviewed_at || ''}`
      : '';
  const showRejectionBanner =
    Boolean(rejectionBannerKey) && dismissedRejectKey !== rejectionBannerKey;

  const markAllRead = () => {
    const nextIds = [...new Set([...readNotifIds, ...notifications.map((n) => n.id)])];
    setReadNotifIds(nextIds);
    writeStringSet(READ_NOTIFS_KEY, nextIds);
  };

  const dismissRejectionBanner = () => {
    if (!rejectionBannerKey) return;
    setDismissedRejectKey(rejectionBannerKey);
    try {
      localStorage.setItem(DISMISSED_REJECT_BANNER_KEY, rejectionBannerKey);
    } catch {
      /* ignore */
    }
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    setUserMenuOpen(false);
    await signOut();
    navigate('/welcome?mode=signin', { replace: true });
  };

  const initials = (profile?.name || 'T')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const renderSearchDropdown = () => (
    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[420px] overflow-y-auto rounded-[24px] border border-slate-200/95 bg-white/95 p-3 shadow-[0_28px_70px_-15px_rgba(8,18,58,0.28)] backdrop-blur-2xl dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-[0_28px_70px_-15px_rgba(0,0,0,0.75)]">
      <p className="px-3 pb-2 pt-1 text-[12px] font-extrabold text-[#08123A] dark:text-slate-100">
        {searchQuery.trim() ? t('header.searchResults') : t('header.recommended')}
      </p>

      {searchResults.length === 0 ? (
        <div className="py-8 text-center text-[13px] font-semibold text-slate-400">
          {t('header.nothingFound')}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {searchResults.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onMouseEnter={() => api.prefetchBrand(item.id)}
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                  navigate(`/brand/${item.id}`);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-100 bg-white text-[12px] font-black text-[#08123A] shadow-sm dark:border-slate-700">
                    {item.logo_url ? (
                      <img
                        src={item.logo_url}
                        alt={item.name}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <span style={{ color: item.accent }}>{item.monogram}</span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-extrabold text-[#08123A] dark:text-slate-100">
                      {item.name}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] font-medium text-slate-500 dark:text-slate-400">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white text-[#08123A] pb-24 transition-colors duration-200 dark:bg-[#070d1f] dark:text-slate-100 md:pb-0">
      {/* =========================================================
          GLASSMORPHISM HEADER (Yengil tiniq blur + glass pill elementlar)
      ========================================================= */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/55 backdrop-blur-md shadow-[0_8px_28px_-14px_rgba(0,45,150,0.12)] dark:border-white/10 dark:bg-[#0B1228]/58 dark:shadow-[0_10px_34px_-14px_rgba(0,0,0,0.55)]">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-2.5 px-3.5 py-2.5 sm:gap-3.5 sm:px-6 md:px-8">
          {/* LOGO OVAL ICHIDA (Glassmorphism) */}
          <Link
            to="/"
            className="imtiyo-glass-pill inline-flex shrink-0 items-center rounded-full px-3 py-1.5 sm:px-4 sm:py-1.5"
          >
            <Logo size="sm" />
          </Link>

          {/* DESKTOP & TABLET GLASS QIDIRUV */}
          {!hideSearch && (
            <div ref={searchWrapRef} className="relative hidden max-w-xl flex-1 md:block">
              <div
                className={cn(
                  'imtiyo-glass-pill flex h-10 w-full items-center gap-2.5 rounded-full pl-4 pr-3.5 transition-all',
                  searchOpen &&
                    '!border-[#1D6FF2]/60 ring-2 ring-[#1D6FF2]/20 dark:!border-sky-400/50 dark:ring-sky-400/20'
                )}
              >
                <Search className="h-4 w-4 shrink-0 text-[#1D6FF2] dark:text-sky-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  placeholder={t('header.searchPlaceholder')}
                  className="h-full w-full bg-transparent text-[13.5px] font-semibold text-[#08123A] outline-none placeholder:font-medium placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={t('common.clear')}
                    className="grid h-6 w-6 place-items-center rounded-full bg-slate-200/70 text-slate-600 hover:bg-slate-200 dark:bg-slate-700/80 dark:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {searchOpen && renderSearchDropdown()}
            </div>
          )}

          {/* O'NG TOMON ELEMENTLARI (Barchasi glassmorphism uslubida) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher />

            {/* SEVIMLILAR / YOQTIRGANLAR */}
            <button
              type="button"
              onClick={() => {
                refreshLikes();
                setSavedModalOpen(true);
              }}
              aria-label={t('header.savedTitle')}
              className="imtiyo-glass-pill relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#08123A] hover:scale-105 dark:text-slate-100"
            >
              <Heart className="h-[18px] w-[18px] fill-transparent text-current" />
              {likedIds.length > 0 && (
                <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full border border-white bg-[#1D6FF2] px-1 text-[10px] font-extrabold text-white shadow-sm dark:border-[#0B1228]">
                  {likedIds.length}
                </span>
              )}
            </button>

            {/* BILDIRISHNOMALAR */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  if (!notifOpen) markAllRead();
                }}
                aria-label={t('header.notifications')}
                className="imtiyo-glass-pill relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#08123A] hover:scale-105 dark:text-slate-100"
              >
                <Bell className="h-[18px] w-[18px] text-current" />
                {unreadCount > 0 && (
                  <span
                    className={cn(
                      'absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full border border-white px-1 text-[9.5px] font-extrabold text-white shadow-sm dark:border-[#0B1228]',
                      hasUnreadRejection ? 'animate-pulse bg-rose-500' : 'bg-[#1D6FF2]'
                    )}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 overflow-hidden rounded-[24px] border border-slate-200/95 bg-white/95 p-3.5 shadow-[0_24px_60px_-15px_rgba(0,45,150,0.35)] backdrop-blur-2xl dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.75)]">
                  <div className="mb-2.5 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                    <span className="text-[13px] font-extrabold text-[#08123A] dark:text-white">
                      {t('header.notifications')}
                    </span>
                    <span className="rounded-full bg-[#1D6FF2]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300">
                      {t('header.appMessages')}
                    </span>
                  </div>
                  <ul className="max-h-80 space-y-2 overflow-y-auto">
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        className={cn(
                          'rounded-2xl border p-3 text-[12px]',
                          n.type === 'rejected'
                            ? 'border-rose-200 bg-rose-50/90 dark:border-rose-500/35 dark:bg-rose-950/45'
                            : n.type === 'verified'
                              ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/30 dark:bg-emerald-950/35'
                              : n.type === 'pending'
                                ? 'border-amber-200 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-950/35'
                                : n.type === 'broadcast'
                                  ? 'border-[#1D6FF2]/25 bg-[#1D6FF2]/[0.06] dark:border-sky-500/30 dark:bg-sky-500/10'
                                  : 'border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/70'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {n.type === 'rejected' && (
                              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                            )}
                            {n.type === 'verified' && (
                              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            )}
                            {n.type === 'pending' && (
                              <Clock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                            )}
                            {n.type === 'broadcast' && (
                              <Megaphone className="h-4 w-4 shrink-0 text-[#1D6FF2] dark:text-sky-400" />
                            )}
                            <p
                              className={cn(
                                'font-extrabold',
                                n.type === 'rejected'
                                  ? 'text-rose-700 dark:text-rose-300'
                                  : n.type === 'verified'
                                    ? 'text-emerald-800 dark:text-emerald-300'
                                    : 'text-[#08123A] dark:text-slate-100'
                              )}
                            >
                              {n.title}
                            </p>
                          </div>
                          <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                            {n.time}
                          </span>
                        </div>
                        <p
                          className={cn(
                            'mt-1 text-[12px] leading-relaxed',
                            n.type === 'rejected'
                              ? 'font-bold text-rose-700 dark:text-rose-200'
                              : 'text-slate-600 dark:text-slate-300'
                          )}
                        >
                          {n.desc}
                        </p>
                        {n.actionType === 'reupload' && (
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setNotifOpen(false);
                                setVerifyModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-sm hover:bg-rose-700"
                            >
                              <Upload className="h-3 w-3" />
                              {n.actionLabel}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNotifOpen(false);
                                navigate('/profile?tab=status');
                              }}
                              className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-500/30 dark:bg-slate-900 dark:text-rose-300"
                            >
                              {t('notif.viewStatus')}
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* ISM VA FAMILIYA (YOKI KIRISH / RO'YXATDAN O'TISH) */}
            {profile?.signedIn ? (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="imtiyo-glass-pill flex h-10 items-center gap-2 rounded-full pl-1.5 pr-2.5 sm:pr-3.5 text-left"
                >
                  <span className="grid h-7 w-7 min-w-[28px] max-w-[28px] shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#002D96] to-[#00A9FF] text-[11px] font-extrabold text-white shadow-sm">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.name}
                        referrerPolicy="no-referrer"
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </span>
                  <span className="hidden max-w-[140px] truncate text-[13px] font-extrabold text-[#08123A] dark:text-slate-100 sm:inline-block">
                    {profile.name}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-slate-500 transition-transform dark:text-slate-400',
                      userMenuOpen && 'rotate-180'
                    )}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-[24px] border border-slate-200/95 bg-white/95 p-2 shadow-[0_24px_60px_-15px_rgba(0,45,150,0.4)] backdrop-blur-2xl dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.75)]">
                    <div className="mb-1.5 flex items-center gap-2.5 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                      <span className="grid h-8 w-8 min-w-[32px] max-w-[32px] shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#002D96] to-[#00A9FF] text-[11.5px] font-extrabold text-white">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.name}
                            referrerPolicy="no-referrer"
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-extrabold text-[#08123A] dark:text-white">
                          {profile.name}
                        </p>
                        <p className="truncate font-mono text-[10.5px] font-bold text-[#1D6FF2] dark:text-sky-400">
                          ID: #{profile.student_id}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/profile');
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12.5px] font-bold text-[#08123A] hover:bg-slate-100/80 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <User className="h-4 w-4 text-[#1D6FF2] dark:text-sky-400" />
                        <span>{t('nav.myProfile')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/profile?tab=settings');
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12.5px] font-bold text-[#08123A] hover:bg-slate-100/80 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Settings className="h-4 w-4 text-[#1D6FF2] dark:text-sky-400" />
                        <span>{t('header.settings')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/profile?tab=codes');
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12.5px] font-bold text-[#08123A] hover:bg-slate-100/80 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Ticket className="h-4 w-4 text-[#1D6FF2] dark:text-sky-400" />
                        <span>{t('header.promoCodes')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/about');
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12.5px] font-bold text-[#08123A] hover:bg-slate-100/80 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Info className="h-4 w-4 text-[#1D6FF2] dark:text-sky-400" />
                        <span>{t('nav.about')}</span>
                      </button>

                      <a
                        href="/help"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] font-bold text-[#08123A] hover:bg-slate-100/80 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <span className="flex items-center gap-2.5">
                          <HelpCircle className="h-4 w-4 text-[#1D6FF2] dark:text-sky-400" />
                          <span>{t('nav.help')}</span>
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                      </a>
                    </div>

                    <div className="mt-1.5 border-t border-slate-100 pt-1.5 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12.5px] font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{t('header.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <Link
                  to="/welcome?mode=signin"
                  className="imtiyo-glass-pill hidden h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 text-[13px] font-extrabold text-[#08123A] hover:text-[#002D96] dark:text-slate-100 dark:hover:text-sky-300 lg:inline-flex"
                >
                  {t('header.login')}
                </Link>
                <Link
                  to="/welcome?mode=signup"
                  className="inline-flex h-10 min-w-[138px] shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-gradient-to-r from-[#002D96] via-[#1D6FF2] to-[#00A9FF] px-5 text-[12.5px] font-extrabold leading-none text-white shadow-[0_10px_24px_-10px_rgba(0,45,150,0.85)] transition-all hover:scale-[1.02] hover:brightness-105 sm:min-w-[158px] sm:px-6 sm:text-[13px]"
                >
                  {t('header.signup')}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* MOBIL GLASS QIDIRUV QATORI (< md) */}
        {!hideSearch && (
          <div ref={mobileSearchWrapRef} className="relative px-3.5 pb-2.5 md:hidden">
            <div
              className={cn(
                'imtiyo-glass-pill flex h-10 w-full items-center gap-2.5 rounded-full pl-4 pr-3.5 transition-all',
                searchOpen &&
                  '!border-[#1D6FF2]/60 ring-2 ring-[#1D6FF2]/20 dark:!border-sky-400/50'
              )}
            >
              <Search className="h-4 w-4 shrink-0 text-[#1D6FF2] dark:text-sky-400" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder={t('header.searchPlaceholder')}
                className="h-full w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none placeholder:font-medium placeholder:text-slate-400 dark:text-slate-100"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="grid h-6 w-6 place-items-center rounded-full bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {searchOpen && renderSearchDropdown()}
          </div>
        )}
      </header>

      {/* =========================================================
          GLOBAL YUQORI GRADIENT + RAD ETILGAN HUJJAT XABARNOMASI + ASOSIY KONTENT
      ========================================================= */}
      <div className="relative flex-1">
        <PageTopGradient />

        {showRejectionBanner && (
          <div className="relative z-20 mx-auto w-full max-w-[1440px] px-4 pt-3.5 md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/95 px-4 py-3 text-rose-800 shadow-sm backdrop-blur-md dark:border-rose-500/35 dark:bg-rose-950/60 dark:text-rose-200">
              <div className="flex min-w-0 flex-1 items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                <div className="min-w-0 text-[12.5px]">
                  <p className="font-extrabold">{t('notif.rejectedTitle')}</p>
                  <p className="mt-0.5 font-semibold leading-snug">
                    {t('notif.rejectedReasonPrefix')}{' '}
                    <span className="font-extrabold">
                      «{profile.rejection_reason || t('notif.rejectedFallback')}»
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-[11.5px] font-extrabold text-white shadow-sm transition-colors hover:bg-rose-700"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {t('notif.reuploadShort')}
                </button>
                <button
                  type="button"
                  onClick={dismissRejectionBanner}
                  aria-label={t('common.close')}
                  className="grid h-7 w-7 place-items-center rounded-full text-rose-600/80 hover:bg-rose-200/60 dark:text-rose-300 dark:hover:bg-rose-900/60"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pt-5 md:px-8">
          {breadcrumbs !== false && Array.isArray(breadcrumbs) && (
            <PageBreadcrumb items={breadcrumbs} />
          )}
          {children}
        </main>
      </div>

      {/* =========================================================
          "IMTIYO NIMA?" (kategoriya sahifalari) + APP PROMO (faqat bosh sahifa)
      ========================================================= */}
      <div className="relative z-10 mt-16">
        {showImtiyoAbout && (
          <div className="mx-auto w-full max-w-[1440px] px-4 pb-12 md:px-8">
            <div className="rounded-[24px] border border-[#1D6FF2]/15 bg-gradient-to-br from-[#EEF4FF] via-[#F3EEFF] to-[#FFF4F0] p-7 shadow-sm dark:border-slate-700/60 dark:from-slate-900 dark:via-[#0F1B3A] dark:to-slate-900 md:p-9">
              <h2 className="text-[20px] font-extrabold text-[#08123A] dark:text-white">
                {t('footer.whatIsImtiyo')}
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed font-medium text-slate-700 dark:text-slate-300">
                {t('footer.aboutP1')}
              </p>
              <p className="mt-3 text-[14px] leading-relaxed font-medium text-slate-700 dark:text-slate-300">
                {t('footer.aboutP2')}
              </p>
              <p className="mt-3 text-[14px] font-bold text-[#002D96] dark:text-sky-300">
                {t('footer.aboutCta')}
              </p>
            </div>
          </div>
        )}

        {/* APP PROMO BANNER — FAQAT BOSH SAHIFADA CHIQADI */}
        {showAppPromo && (
          <section className="relative overflow-hidden bg-gradient-to-r from-[#002D96] via-[#1E1B4B] to-[#0B1228] text-white">
            <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-8 px-4 py-12 md:grid-cols-12 md:px-8">
              <div className="space-y-4 md:col-span-7">
                <h2 className="text-[26px] font-black leading-tight md:text-[34px]">
                  {t('footer.appPromoTitle')}
                </h2>
                <p className="max-w-lg text-[14.5px] text-white/85">
                  {t('footer.appPromoSubtitle')}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href="#google-play"
                    onClick={(e) => e.preventDefault()}
                    className="inline-flex items-center gap-2.5 rounded-xl border border-white/25 bg-black/85 px-4 py-2.5 text-left transition-transform hover:scale-105"
                  >
                    <span className="text-[20px]">▶️</span>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">
                        GET IT ON
                      </p>
                      <p className="text-[14px] font-extrabold leading-none">Google Play</p>
                    </div>
                  </a>

                  <a
                    href="#app-store"
                    onClick={(e) => e.preventDefault()}
                    className="inline-flex items-center gap-2.5 rounded-xl border border-white/25 bg-black/85 px-4 py-2.5 text-left transition-transform hover:scale-105"
                  >
                    <span className="text-[20px]"></span>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">
                        Download on the
                      </p>
                      <p className="text-[14px] font-extrabold leading-none">App Store</p>
                    </div>
                  </a>
                </div>

                <div className="inline-flex flex-col rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-md">
                  <span className="text-[11px] font-semibold text-white/85">
                    {t('footer.appRating')}
                  </span>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="text-[16px] font-black">5.0</span>
                    <div className="flex text-amber-400">
                      <Star className="h-4 w-4 fill-amber-400" />
                      <Star className="h-4 w-4 fill-amber-400" />
                      <Star className="h-4 w-4 fill-amber-400" />
                      <Star className="h-4 w-4 fill-amber-400" />
                      <Star className="h-4 w-4 fill-amber-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden justify-center gap-5 md:col-span-5 md:flex">
                <div className="w-48 rounded-[32px] border-[6px] border-slate-900 bg-white p-3 text-[#08123A] shadow-2xl">
                  <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-slate-900" />
                  <p className="text-[12px] font-black text-[#002D96]">imtiyo</p>
                  <div className="mt-2 h-24 rounded-2xl bg-gradient-to-br from-[#002D96] to-[#1D6FF2] p-2.5 text-white">
                    <span className="rounded bg-white/20 px-1.5 py-0.5 text-[8px] font-bold">
                      -30% Student
                    </span>
                    <p className="mt-4 text-[10px] font-extrabold">{t('app.tagline')}</p>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <div className="h-14 rounded-xl bg-slate-100 p-2 text-[9px] font-bold text-[#08123A]">
                      EVOS
                    </div>
                    <div className="h-14 rounded-xl bg-slate-100 p-2 text-[9px] font-bold text-[#08123A]">
                      Safia
                    </div>
                  </div>
                </div>

                <div className="-mt-6 w-48 rounded-[32px] border-[6px] border-slate-900 bg-white p-3 text-[#08123A] shadow-2xl">
                  <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-slate-900" />
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="h-20 rounded-xl bg-orange-500/15 p-2 text-[9px] font-bold text-orange-800">
                      -25% {t('cat.food')}
                    </div>
                    <div className="h-20 rounded-xl bg-emerald-500/15 p-2 text-[9px] font-bold text-emerald-800">
                      1Fit Bonus
                    </div>
                  </div>
                  <div className="mt-2 h-24 rounded-2xl bg-slate-100 p-2.5 text-[9.5px] font-extrabold text-[#002D96]">
                    {t('card.title')}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* DARK FOOTER */}
        <footer className="border-t border-white/10 bg-[#070B18] text-white">
          <div className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
            <div className="grid grid-cols-1 gap-8 pb-10 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <span className="text-[24px] font-black tracking-tight text-white">imtiyo</span>
                <p className="mt-2.5 max-w-xs text-[13px] leading-relaxed text-white/70">
                  {t('footer.brandDesc')}
                </p>
              </div>

              <div>
                <h3 className="text-[13.5px] font-extrabold text-white">
                  {t('footer.contactTitle')}
                </h3>
                <ul className="mt-3 space-y-2 text-[12.5px] text-white/75">
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
                    <span>{t('footer.city')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-white/50" />
                    <span>info@imtiyo.uz</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Send className="h-4 w-4 shrink-0 text-white/50" />
                    <a
                      href="https://t.me/imtiyosupport_bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white hover:underline"
                    >
                      @imtiyosupport_bot
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-[13.5px] font-extrabold text-white">
                  {t('footer.importantLinks')}
                </h3>
                <ul className="mt-3 space-y-2 text-[12.5px] text-white/75">
                  <li>
                    <Link to="/about" className="hover:text-white hover:underline">
                      {t('nav.about')}
                    </Link>
                  </li>
                  <li>
                    <a
                      href="/help"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-white hover:underline"
                    >
                      <span>{t('nav.helpFaq')}</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </li>
                  <li>
                    <Link to="/map" className="hover:text-white hover:underline">
                      {t('nav.mapFull')}
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-[13.5px] font-extrabold text-white">
                  {t('footer.documents')}
                </h3>
                <ul className="mt-3 space-y-2 text-[12.5px] text-white/75">
                  <li>
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-white hover:underline"
                    >
                      <span>{t('nav.terms')}</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-white hover:underline"
                    >
                      <span>{t('nav.privacy')}</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="/help"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-white hover:underline"
                    >
                      <span>{t('nav.faq')}</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-[12px] text-white/60">
              <p>{t('footer.rights')}</p>
              <div className="flex items-center gap-4">
                <a
                  href="https://t.me/imtiyosupport_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white"
                >
                  <Send className="h-4 w-4" />
                </a>
                <a
                  href="#instagram"
                  onClick={(e) => e.preventDefault()}
                  className="text-white/70 hover:text-white"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* MOBIL PASTKI LIQUID GLASS DOCK */}
      <MobileBottomDock />

      {/* SAQLANGANLAR MODALI */}
      {savedModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#08123A]/60 p-4 backdrop-blur-sm"
          onClick={() => setSavedModalOpen(false)}
        >
          <div
            className="max-h-[84vh] w-full max-w-md overflow-y-auto overscroll-contain rounded-[28px] border border-slate-200/90 bg-white p-5 shadow-2xl dark:border-slate-700/70 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-[#1D6FF2] dark:text-sky-400" />
                <h3 className="text-[16px] font-extrabold text-[#08123A] dark:text-white">
                  {t('header.savedTitle')} ({savedItems.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSavedModalOpen(false)}
                aria-label={t('common.close')}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {savedItems.length === 0 ? (
              <div className="py-10 text-center">
                <Heart className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="mt-2 text-[13.5px] font-extrabold text-[#08123A] dark:text-white">
                  {t('header.savedEmpty')}
                </p>
                <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                  {t('header.savedEmptyHint')}
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {savedItems.map((item) => (
                  <li
                    key={item.likeId}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 transition-colors hover:bg-white dark:border-slate-800 dark:bg-slate-800/70 dark:hover:bg-slate-800"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSavedModalOpen(false);
                        if (item.slug) {
                          const targetUrl = item.offerId
                            ? `/brand/${item.slug}?offer=${encodeURIComponent(item.offerId)}`
                            : `/brand/${item.slug}`;
                          navigate(targetUrl);
                        }
                      }}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span
                        className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-100 bg-white text-[13px] font-black text-white dark:border-slate-700"
                        style={{ backgroundColor: item.logo_url ? '#fff' : item.accent }}
                      >
                        {item.logo_url ? (
                          <img
                            src={item.logo_url}
                            alt={item.title}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          item.monogram
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-extrabold text-[#08123A] dark:text-slate-100">
                          {item.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="rounded-md bg-[#1D6FF2]/10 px-1.5 py-0.5 text-[10.5px] font-extrabold text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300">
                            {item.discount}
                          </span>
                          <span className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {item.subtitle}
                          </span>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        api.toggleLike(item.likeId);
                        refreshLikes();
                      }}
                      title={t('common.delete')}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-rose-950/60 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* GUEST / UNVERIFIED AUTH PROMPT CARD MODAL */}
      <AuthPromptCardModal
        open={authPromptOpen}
        reason={authPromptReason}
        signedIn={Boolean(profile?.signedIn)}
        onClose={() => setAuthPromptOpen(false)}
        onOpenVerify={() => setVerifyModalOpen(true)}
      />

      <VerifyModal open={verifyModalOpen} onOpenChange={setVerifyModalOpen} />

      {/* CHIQISHNI TASDIQLASH MODALI */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#08123A]/55 p-4 backdrop-blur-sm"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-[26px] border border-slate-200/90 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[16px] font-extrabold text-[#08123A] dark:text-white">
              {t('header.logoutTitle')}
            </h3>
            <p className="mt-1.5 text-[13px] text-slate-600 dark:text-slate-300">
              {t('header.logoutConfirm')}
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-full border border-slate-200 bg-white py-2.5 text-[12.5px] font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {t('common.no')}
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 rounded-full bg-rose-500 py-2.5 text-[12.5px] font-bold text-white hover:bg-rose-600"
              >
                {t('header.logoutYes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
