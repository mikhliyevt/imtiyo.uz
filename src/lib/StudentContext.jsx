import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, generateNumericId, normalizeCourse } from '@/services/api';
import { supabase } from '@/lib/supabase';

const StudentContext = createContext(null);

const LOCAL_PROFILE_KEY = 'imtiyo_student_profile_v2';
const PROFILE_REVIEWS_KEY = 'imtiyo_profile_reviews_v1';
export const OAUTH_PENDING_KEY = 'imtiyo_oauth_pending_v1';
export const OAUTH_RETURN_KEY = 'imtiyo_oauth_return_to_v1';
export const SIGNUP_IN_PROGRESS_KEY = 'imtiyo_signup_in_progress_v1';

const DEFAULT_GUEST_PROFILE = {
  id: '',
  name: '',
  full_name: '',
  email: '',
  phone: '',
  university: '',
  course: '',
  gender: '',
  birth_date: '',
  region: '',
  avatar_url: '',
  student_id: '',
  provider: 'email',
  status: 'unverified',
  signedIn: false,
  document_name: '',
  document_url: '',
  rejection_reason: '',
  reviewed_by: '',
  reviewed_at: '',
};

function readStoredProfile() {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (!raw) return DEFAULT_GUEST_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_GUEST_PROFILE,
      ...parsed,
      course: normalizeCourse(parsed?.course),
    };
  } catch {
    return DEFAULT_GUEST_PROFILE;
  }
}

function writeStoredProfile(profile) {
  try {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

function clearLocalReviewCache(profileId) {
  if (!profileId) return;
  try {
    const raw = localStorage.getItem(PROFILE_REVIEWS_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    if (map && map[profileId]) {
      delete map[profileId];
      localStorage.setItem(PROFILE_REVIEWS_KEY, JSON.stringify(map));
    }
  } catch {
    /* ignore */
  }
}

function hasOAuthCallbackSignals() {
  if (typeof window === 'undefined') return false;
  const search = window.location.search || '';
  const hash = window.location.hash || '';
  const hasUrlOAuth =
    search.includes('code=') ||
    hash.includes('access_token=') ||
    hash.includes('refresh_token=');
  let hasPendingFlag = false;
  try {
    hasPendingFlag = sessionStorage.getItem(OAUTH_PENDING_KEY) === '1';
  } catch {
    /* ignore */
  }
  return hasUrlOAuth || hasPendingFlag;
}

function stripOAuthParamsFromUrl() {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    let changed = false;
    for (const p of ['code', 'state', 'error', 'error_description']) {
      if (url.searchParams.has(p)) {
        url.searchParams.delete(p);
        changed = true;
      }
    }
    if (
      url.hash &&
      (url.hash.includes('access_token=') ||
        url.hash.includes('refresh_token=') ||
        url.hash.includes('provider_token='))
    ) {
      url.hash = '';
      changed = true;
    }
    if (changed) {
      window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    }
  } catch {
    /* ignore */
  }
}

export function StudentProvider({ children }) {
  const [profile, setProfile] = useState(() => readStoredProfile());
  const [loading, setLoading] = useState(() => {
    const stored = readStoredProfile();
    if (stored?.signedIn) return false;
    return hasOAuthCallbackSignals();
  });

  const syncInFlightRef = useRef(null);
  const signInInFlightRef = useRef(null);
  const codeExchangedRef = useRef(false);

  const signIn = useCallback(async (payload = {}) => {
    const cleanEmail = String(payload.email || '').trim().toLowerCase();
    const cleanPhone = String(payload.phone || '').trim();
    const cleanId = String(payload.id || '').trim();
    const cleanCourse = normalizeCourse(payload.course);
    const lockKey = cleanId || cleanEmail || cleanPhone.replace(/\D/g, '').slice(-9) || 'anon';

    // Bir vaqtning o'zida 2 ta signIn (masalan onAuthStateChange + Welcome.jsx) poygalashmasligi uchun
    if (signInInFlightRef.current && signInInFlightRef.current.key === lockKey) {
      return signInInFlightRef.current.promise;
    }

    const run = (async () => {
      // Agar Supabase Authda BOSHQA emailning eski sessiyasi qolib ketgan bo'lsa,
      // tozalab tashlaymiz (keyin onAuthStateChange boshqa profilga o'tkazib yubormasligi uchun)
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const activeAuthEmail = String(sessionData?.session?.user?.email || '')
          .trim()
          .toLowerCase();
        if (activeAuthEmail && cleanEmail && activeAuthEmail !== cleanEmail) {
          await supabase.auth.signOut().catch(() => {});
        } else if (activeAuthEmail && !cleanEmail && cleanPhone) {
          await supabase.auth.signOut().catch(() => {});
        }
      } catch {
        /* ignore */
      }

      let existing = await api
        .findProfile({ id: cleanId, email: cleanEmail, phone: cleanPhone })
        .catch(() => null);

      const isExistingAccount = Boolean(existing);

      if (!existing) {
        existing = await api.createProfile({
          full_name: payload.name || payload.full_name || 'Talaba',
          email: cleanEmail,
          phone: cleanPhone,
          university: payload.university || '',
          course: cleanCourse,
          gender: payload.gender || '',
          birth_date: payload.birth_date || '',
          region: payload.region || '',
          avatar_url: payload.avatar_url || '',
          provider: payload.provider || 'email',
          student_id: generateNumericId(),
          status: 'unverified',
        });
      } else if (existing.id) {
        // Mavjud bitta asosiy akkauntga to'g'ridan-to'g'ri ulanish va faqat bo'sh maydonlarni to'ldirish
        const fillPatch = { last_login: new Date().toISOString() };
        if (!existing.avatar_url && payload.avatar_url) fillPatch.avatar_url = payload.avatar_url;
        if ((!existing.full_name || existing.full_name === 'Talaba') && payload.name) {
          fillPatch.full_name = payload.name;
        }
        if (!existing.phone && cleanPhone) fillPatch.phone = cleanPhone;
        if (!existing.email && cleanEmail) fillPatch.email = cleanEmail;
        api.saveProfile(existing.id, fillPatch).catch(() => {});
      }

      const nextProfile = {
        ...DEFAULT_GUEST_PROFILE,
        ...existing,
        // Mavjud akkauntning ism/OTM/kurs/student_id kabi ma'lumotlarini hech qachon ustidan yozmaslik
        ...(payload.name && (!isExistingAccount || !existing.name || existing.name === 'Talaba')
          ? { name: payload.name, full_name: payload.name }
          : {}),
        ...(payload.university && (!isExistingAccount || !existing.university)
          ? { university: payload.university }
          : {}),
        ...(cleanCourse && (!isExistingAccount || !existing.course)
          ? { course: cleanCourse }
          : { course: normalizeCourse(existing?.course) }),
        ...(payload.gender && (!isExistingAccount || !existing.gender)
          ? { gender: payload.gender }
          : {}),
        ...(payload.birth_date && (!isExistingAccount || !existing.birth_date)
          ? { birth_date: payload.birth_date }
          : {}),
        ...(payload.region && (!isExistingAccount || !existing.region)
          ? { region: payload.region }
          : {}),
        ...(payload.avatar_url && (!isExistingAccount || !existing.avatar_url)
          ? { avatar_url: payload.avatar_url }
          : {}),
        signedIn: true,
      };

      setProfile(nextProfile);
      writeStoredProfile(nextProfile);
      return nextProfile;
    })();

    signInInFlightRef.current = { key: lockKey, promise: run };
    try {
      return await run;
    } finally {
      if (signInInFlightRef.current?.promise === run) {
        signInInFlightRef.current = null;
      }
    }
  }, []);

  // Google OAuth / Supabase Auth session automatic sync without requiring manual reload
  useEffect(() => {
    let mounted = true;
    const safetyTimer = loading
      ? window.setTimeout(() => {
          if (mounted) {
            try {
              sessionStorage.removeItem(OAUTH_PENDING_KEY);
            } catch {
              /* ignore */
            }
            setLoading(false);
          }
        }, 5500)
      : null;

    const clearOAuthState = () => {
      try {
        sessionStorage.removeItem(OAUTH_PENDING_KEY);
      } catch {
        /* ignore */
      }
      stripOAuthParamsFromUrl();
      if (mounted) setLoading(false);
    };

    const syncOAuthUser = async (sessionUser, authEvent = '') => {
      if (!sessionUser || !mounted) return null;

      // Agar foydalanuvchi hozir email ro'yxatdan o'tishning anketa (details) bosqichida bo'lsa,
      // hali bo'sh dublikat profil yaratmaslik kerak
      try {
        if (sessionStorage.getItem(SIGNUP_IN_PROGRESS_KEY) === '1') {
          clearOAuthState();
          return null;
        }
      } catch {
        /* ignore */
      }

      if (syncInFlightRef.current) return syncInFlightRef.current;

      const task = (async () => {
        try {
          const email = (sessionUser.email || '').toLowerCase();
          const meta = sessionUser.user_metadata || {};
          const fullName =
            meta.full_name || meta.name || (email ? email.split('@')[0] : 'Talaba');
          const googleAvatar =
            meta.avatar_url ||
            meta.picture ||
            sessionUser.identities?.[0]?.identity_data?.avatar_url ||
            sessionUser.identities?.[0]?.identity_data?.picture ||
            '';

          const current = readStoredProfile();
          const oauthPending = hasOAuthCallbackSignals();

          // Agar foydalanuvchi allaqachon boshqa akkauntda (masalan telefon yoki parol tiklash orqali)
          // kirgan bo'lsa va yangi Google OAuth bosilmagan bo'lsa, eski sessiya profilni almashtirmasin
          if (
            current?.signedIn &&
            !oauthPending &&
            authEvent !== 'SIGNED_IN' &&
            (!email || (current.email && current.email.toLowerCase() !== email))
          ) {
            return current;
          }

          if (current?.signedIn && email && current?.email?.toLowerCase() === email) {
            if (googleAvatar && !current.avatar_url) {
              const withPic = { ...current, avatar_url: googleAvatar };
              if (mounted) setProfile(withPic);
              writeStoredProfile(withPic);
              if (current.id) api.saveProfile(current.id, { avatar_url: googleAvatar }).catch(() => {});
            }
            return current;
          }

          const signed = await signIn({
            provider: sessionUser.app_metadata?.provider || 'google',
            email,
            name: fullName,
            avatar_url: googleAvatar,
          });

          if (googleAvatar && signed?.id && !signed.avatar_url) {
            await api.saveProfile(signed.id, { avatar_url: googleAvatar }).catch(() => {});
          }
          return signed;
        } finally {
          syncInFlightRef.current = null;
          clearOAuthState();
        }
      })();

      syncInFlightRef.current = task;
      return task;
    };

    const bootstrapSession = async () => {
      try {
        // Check if PKCE ?code= needs explicit exchange
        const params = new URLSearchParams(window.location.search);
        const oauthCode = params.get('code');

        let { data } = await supabase.auth.getSession();

        if (!data?.session && oauthCode && !codeExchangedRef.current) {
          codeExchangedRef.current = true;
          try {
            const exchanged = await supabase.auth.exchangeCodeForSession(oauthCode);
            if (exchanged?.data?.session) {
              data = { session: exchanged.data.session };
            }
          } catch {
            // Supabase client may have already exchanged the code concurrently
            const retry = await supabase.auth.getSession();
            data = retry.data;
          }
        }

        if (data?.session?.user) {
          await syncOAuthUser(data.session.user, 'INITIAL_SESSION');
        } else if (!window.location.hash.includes('access_token=')) {
          // No session and no implicit hash pending
          clearOAuthState();
        }
      } catch {
        clearOAuthState();
      }
    };

    bootstrapSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === 'INITIAL_SESSION' ||
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED') &&
        session?.user
      ) {
        syncOAuthUser(session.user, event);
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          localStorage.removeItem(LOCAL_PROFILE_KEY);
          setProfile(DEFAULT_GUEST_PROFILE);
          clearOAuthState();
        }
      } else if (event === 'INITIAL_SESSION' && !session) {
        clearOAuthState();
      }
    });

    return () => {
      mounted = false;
      if (safetyTimer) window.clearTimeout(safetyTimer);
      authListener?.subscription?.unsubscribe();
    };
  }, [signIn]);

  const reload = useCallback(async () => {
    const current = readStoredProfile();
    if (!current?.signedIn) {
      return current;
    }

    let localReview = null;
    try {
      const rawReviews = localStorage.getItem(PROFILE_REVIEWS_KEY);
      if (rawReviews && current.id) {
        const parsed = JSON.parse(rawReviews);
        localReview = parsed?.[current.id] || null;
      }
    } catch {
      /* ignore */
    }

    try {
      const matched = await api.findProfile({
        id: current.id,
        email: current.email,
        phone: current.phone,
      });

      if (matched) {
        const nextStatus = matched.status || localReview?.status || current.status;
        const merged = {
          ...current,
          ...matched,
          status: nextStatus,
          rejection_reason:
            nextStatus === 'rejected'
              ? matched.rejection_reason || localReview?.rejection_reason || current.rejection_reason || ''
              : '',
          reviewed_by: matched.reviewed_by || localReview?.reviewed_by || current.reviewed_by || '',
          reviewed_at: matched.reviewed_at || localReview?.reviewed_at || current.reviewed_at || '',
          name: matched.full_name || matched.name || current.name,
          course: normalizeCourse(matched.course || current.course),
          signedIn: true,
        };
        setProfile(merged);
        writeStoredProfile(merged);
        return merged;
      }
    } catch {
      /* ignore */
    }

    if (localReview) {
      const nextStatus = localReview.status || current.status;
      const mergedLocal = {
        ...current,
        status: nextStatus,
        rejection_reason:
          nextStatus === 'rejected'
            ? localReview.rejection_reason ?? current.rejection_reason ?? ''
            : '',
        reviewed_by: localReview.reviewed_by ?? current.reviewed_by ?? '',
        reviewed_at: localReview.reviewed_at ?? current.reviewed_at ?? '',
        signedIn: true,
      };
      setProfile(mergedLocal);
      writeStoredProfile(mergedLocal);
      return mergedLocal;
    }

    return current;
  }, []);

  useEffect(() => {
    if (!profile?.signedIn) return;
    reload();

    const handleRefresh = () => {
      if (document.visibilityState === 'hidden') return;
      reload();
    };
    const handleStorage = (e) => {
      if (
        e.key === LOCAL_PROFILE_KEY ||
        e.key === PROFILE_REVIEWS_KEY ||
        e.key === null
      ) {
        reload();
      }
    };

    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleRefresh);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('imtiyo_profile_updated', reload);

    let pollTimer = null;
    if (profile.status === 'pending' || profile.status === 'unverified') {
      pollTimer = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
          reload();
        }
      }, 25000);
    }

    return () => {
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleRefresh);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('imtiyo_profile_updated', reload);
      if (pollTimer) window.clearInterval(pollTimer);
    };
  }, [profile?.signedIn, profile?.status, reload]);

  const updateProfile = useCallback(async (changes = {}) => {
    const current = readStoredProfile();

    if (changes.status === 'pending') {
      clearLocalReviewCache(current?.id);
    }

    const normalizedChanges = {
      ...changes,
      ...('course' in changes ? { course: normalizeCourse(changes.course) } : {}),
    };

    const updatedLocal = {
      ...current,
      ...normalizedChanges,
      name: normalizedChanges.name || normalizedChanges.full_name || current.name,
      full_name:
        normalizedChanges.full_name ||
        normalizedChanges.name ||
        current.full_name ||
        current.name,
      course: normalizeCourse(
        'course' in normalizedChanges ? normalizedChanges.course : current.course
      ),
      signedIn: true,
    };
    setProfile(updatedLocal);
    writeStoredProfile(updatedLocal);

    if (current?.id) {
      const saved = await api.saveProfile(current.id, normalizedChanges);
      if (saved) {
        const finalMerged = {
          ...updatedLocal,
          ...saved,
          course: normalizeCourse(
            'course' in normalizedChanges
              ? normalizedChanges.course
              : saved.course || updatedLocal.course
          ),
          ...(normalizedChanges.status === 'pending'
            ? {
                status: 'pending',
                rejection_reason: '',
                reviewed_by: '',
                document_name: normalizedChanges.document_name || saved.document_name,
                document_url: normalizedChanges.document_url || saved.document_url,
              }
            : {}),
          signedIn: true,
        };
        setProfile(finalMerged);
        writeStoredProfile(finalMerged);
        return finalMerged;
      }
    }
    return updatedLocal;
  }, []);

  const submitVerification = useCallback(
    async ({ fullName, university, documentName, documentUrl, file }) => {
      const now = new Date().toISOString();
      const current = readStoredProfile();
      clearLocalReviewCache(current?.id);

      let finalDocUrl = documentUrl || '';
      const finalDocName = documentName || file?.name || 'talaba-hujjat';

      if (file && !finalDocUrl) {
        try {
          finalDocUrl = await api.uploadFile(file, 'docs');
        } catch {
          finalDocUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result || ''));
            reader.readAsDataURL(file);
          });
        }
      }

      return updateProfile({
        name: fullName || current.name,
        full_name: fullName || current.full_name || current.name,
        university: university || current.university,
        document_name: finalDocName,
        document_url: finalDocUrl,
        submitted_date: now,
        status: 'pending',
        rejection_reason: '',
        reviewed_by: '',
      });
    },
    [updateProfile]
  );

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    try {
      sessionStorage.removeItem(OAUTH_PENDING_KEY);
      sessionStorage.removeItem(OAUTH_RETURN_KEY);
    } catch {
      /* ignore */
    }
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    setProfile(DEFAULT_GUEST_PROFILE);
  }, []);

  const value = useMemo(
    () => ({
      profile,
      loading,
      isLoadingStudent: loading,
      signIn,
      signOut,
      updateProfile,
      submitVerification,
      reload,
    }),
    [profile, loading, signIn, signOut, updateProfile, submitVerification, reload]
  );

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
}

export const useStudent = () => {
  const ctx = useContext(StudentContext);
  if (!ctx) {
    return {
      profile: DEFAULT_GUEST_PROFILE,
      loading: false,
      isLoadingStudent: false,
      signIn: async () => DEFAULT_GUEST_PROFILE,
      signOut: async () => {},
      updateProfile: async () => DEFAULT_GUEST_PROFILE,
      submitVerification: async () => DEFAULT_GUEST_PROFILE,
      reload: async () => DEFAULT_GUEST_PROFILE,
    };
  }
  return ctx;
};
