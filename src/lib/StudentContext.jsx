import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, generateNumericId } from '@/services/api';
import { supabase } from '@/lib/supabase';

const StudentContext = createContext(null);

const LOCAL_PROFILE_KEY = 'imtiyo_student_profile_v2';
const PROFILE_REVIEWS_KEY = 'imtiyo_profile_reviews_v1';

const DEFAULT_GUEST_PROFILE = {
  id: '',
  name: '',
  full_name: '',
  email: '',
  phone: '',
  university: '',
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
};

function readStoredProfile() {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (!raw) return DEFAULT_GUEST_PROFILE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_GUEST_PROFILE, ...parsed };
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

export function StudentProvider({ children }) {
  const [profile, setProfile] = useState(() => readStoredProfile());
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(async (payload = {}) => {
    const all = await api.listProfiles().catch(() => []);
    const cleanEmail = String(payload.email || '').trim().toLowerCase();
    const cleanPhoneDigits = String(payload.phone || '').replace(/\D/g, '').slice(-9);

    let existing = all.find((p) => {
      if (cleanEmail && p.email && p.email.toLowerCase() === cleanEmail) return true;
      if (
        cleanPhoneDigits &&
        p.phone &&
        p.phone.replace(/\D/g, '').slice(-9) === cleanPhoneDigits
      ) {
        return true;
      }
      return false;
    });

    if (!existing) {
      existing = await api.createProfile({
        full_name: payload.name || payload.full_name || 'Talaba',
        email: cleanEmail,
        phone: payload.phone || '',
        university: payload.university || '',
        gender: payload.gender || '',
        birth_date: payload.birth_date || '',
        region: payload.region || '',
        avatar_url: payload.avatar_url || '',
        provider: payload.provider || 'email',
        student_id: generateNumericId(),
        status: 'unverified',
      });
    }

    const nextProfile = {
      ...DEFAULT_GUEST_PROFILE,
      ...existing,
      ...(payload.name ? { name: payload.name, full_name: payload.name } : {}),
      ...(payload.university ? { university: payload.university } : {}),
      ...(payload.gender ? { gender: payload.gender } : {}),
      ...(payload.birth_date ? { birth_date: payload.birth_date } : {}),
      ...(payload.region ? { region: payload.region } : {}),
      ...(payload.avatar_url ? { avatar_url: payload.avatar_url } : {}),
      signedIn: true,
    };

    setProfile(nextProfile);
    writeStoredProfile(nextProfile);
    return nextProfile;
  }, []);

  // Google OAuth orqali kirilganda Supabase sessiyasini avtomatik ushlab olish
  useEffect(() => {
    let mounted = true;

    const syncOAuthUser = async (sessionUser) => {
      if (!sessionUser || !mounted) return;
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
      if (current?.signedIn && current?.email?.toLowerCase() === email) {
        if (googleAvatar && !current.avatar_url) {
          const withPic = { ...current, avatar_url: googleAvatar };
          setProfile(withPic);
          writeStoredProfile(withPic);
          if (current.id) api.saveProfile(current.id, { avatar_url: googleAvatar });
        }
        return;
      }

      const signed = await signIn({
        provider: sessionUser.app_metadata?.provider || 'google',
        email,
        name: fullName,
        avatar_url: googleAvatar,
      });

      if (googleAvatar && signed?.id && !signed.avatar_url) {
        await api.saveProfile(signed.id, { avatar_url: googleAvatar });
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        syncOAuthUser(data.session.user);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        syncOAuthUser(session.user);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [signIn]);

  const reload = useCallback(async () => {
    const current = readStoredProfile();
    if (!current?.signedIn) {
      setLoading(false);
      return current;
    }

    try {
      const all = await api.listProfiles();
      const matched = all.find(
        (p) =>
          (current.id && p.id === current.id) ||
          (current.email && p.email && p.email.toLowerCase() === current.email.toLowerCase()) ||
          (current.phone &&
            p.phone &&
            p.phone.replace(/\D/g, '').slice(-9) === current.phone.replace(/\D/g, '').slice(-9))
      );

      if (matched) {
        const merged = {
          ...current,
          ...matched,
          name: matched.full_name || matched.name || current.name,
          signedIn: true,
        };
        setProfile(merged);
        writeStoredProfile(merged);
        return merged;
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
    return current;
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const updateProfile = useCallback(async (changes = {}) => {
    const current = readStoredProfile();

    // Agar talaba yangi hujjat yuborayotgan bo'lsa (status === 'pending'), eski rad etish izohini tozalaymiz
    if (changes.status === 'pending') {
      clearLocalReviewCache(current?.id);
    }

    const updatedLocal = {
      ...current,
      ...changes,
      name: changes.name || changes.full_name || current.name,
      full_name: changes.full_name || changes.name || current.full_name || current.name,
      signedIn: true,
    };
    setProfile(updatedLocal);
    writeStoredProfile(updatedLocal);

    if (current?.id) {
      const saved = await api.saveProfile(current.id, changes);
      if (saved) {
        const finalMerged = {
          ...updatedLocal,
          ...saved,
          ...(changes.status === 'pending'
            ? {
                status: 'pending',
                rejection_reason: '',
                reviewed_by: '',
                document_name: changes.document_name || saved.document_name,
                document_url: changes.document_url || saved.document_url,
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

  // Qayta hujjat yuborilganda statusni "pending" qilish, eski commentni tozalash va yangi faylni saqlash
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
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    setProfile(DEFAULT_GUEST_PROFILE);
  }, []);

  const value = useMemo(
    () => ({
      profile,
      loading: false,
      isLoadingStudent: false,
      signIn,
      signOut,
      updateProfile,
      submitVerification,
      reload,
    }),
    [profile, signIn, signOut, updateProfile, submitVerification, reload]
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