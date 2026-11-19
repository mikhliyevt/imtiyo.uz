import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured =
  /^https?:\/\/.+/i.test(supabaseUrl) && supabaseKey.length > 0;

function createUnavailableError() {
  return new Error(
    'Supabase sozlanmagan (.env faylida VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY qiymatlarini kiriting)'
  );
}

function createFallbackQueryBuilder() {
  const result = {
    data: null,
    error: createUnavailableError(),
    count: null,
    status: 503,
  };

  const builder = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return (onFulfilled, onRejected) =>
            Promise.resolve(result).then(onFulfilled, onRejected);
        }
        if (prop === 'catch') {
          return (onRejected) => Promise.resolve(result).catch(onRejected);
        }
        if (prop === 'finally') {
          return (onFinally) => Promise.resolve(result).finally(onFinally);
        }
        if (prop === Symbol.toStringTag) {
          return 'SupabaseFallbackQueryBuilder';
        }
        return () => builder;
      },
    }
  );

  return builder;
}

function createFallbackSupabaseClient() {
  if (typeof console !== 'undefined') {
    console.warn(
      '[Imtiyo] VITE_SUPABASE_URL yoki VITE_SUPABASE_ANON_KEY topilmadi. Ilova lokal (offline/demo) rejimda ishlamoqda. Real baza va Google OAuth uchun loyiha ildizida .env faylini yarating (.env.example namunasiga qarang).'
    );
  }

  return {
    from: () => createFallbackQueryBuilder(),
    rpc: () => createFallbackQueryBuilder(),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      exchangeCodeForSession: async () => ({
        data: { session: null, user: null },
        error: createUnavailableError(),
      }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signOut: async () => ({ error: null }),
      signInWithOAuth: async () => ({
        data: { provider: null, url: null },
        error: createUnavailableError(),
      }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: createUnavailableError(),
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: createUnavailableError(),
      }),
      updateUser: async () => ({
        data: { user: null },
        error: createUnavailableError(),
      }),
      signInWithOtp: async () => ({
        data: { user: null, session: null },
        error: createUnavailableError(),
      }),
      verifyOtp: async () => ({
        data: { user: null, session: null },
        error: createUnavailableError(),
      }),
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: createUnavailableError() }),
        remove: async () => ({ data: null, error: createUnavailableError() }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    functions: {
      invoke: async () => ({ data: null, error: createUnavailableError() }),
    },
  };
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createFallbackSupabaseClient();
