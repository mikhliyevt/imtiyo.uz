import { supabase } from '@/lib/supabase';
import {
  brands as sampleBrands,
  locations as sampleLocations,
  offers as sampleOffers,
  DEMO_STUDENT,
} from '@/data/mockData';

const STORAGE_KEYS = {
  LIKED_OFFERS: 'imtiyo_liked_offers_v1',
  ADMIN_SESSION: 'imtiyo_admin_session_v1',
  CATEGORIES: 'imtiyo_categories_v1',
  BRAND_EXTRAS: 'imtiyo_brand_extras_v1',
  OFFER_EXTRAS: 'imtiyo_offer_extras_v1',
  PROFILE_REVIEWS: 'imtiyo_profile_reviews_v1',
  PROFILE_EXTRAS: 'imtiyo_profile_extras_v1',
  LOCAL_PROFILES: 'imtiyo_local_profiles_v1',
  ADMIN_PERMISSIONS: 'imtiyo_admin_permissions_v1',
  SUPPORT_MESSAGES: 'imtiyo_support_messages_v1',
  BROADCAST_NOTIFICATIONS: 'imtiyo_broadcast_notifications_v1',
};

export const COURSE_OPTIONS = ['1', '2', '3', '4', '5', '6'];

export function normalizeCourse(value) {
  if (value === null || value === undefined || value === '') return '';
  const str = String(value).replace(/\D/g, '').trim();
  return COURSE_OPTIONS.includes(str) ? str : '';
}

export const AVAILABLE_SECTIONS = [
  { id: 'recommended', label: 'Tavsiya etilganlar' },
  { id: 'new', label: 'Yangilar' },
  { id: 'popular', label: 'Ommabop' },
];

// In-memory TTL cache + in-flight request deduplication (prevents duplicate & waterfall API calls)
const CACHE_TTL_MS = 60 * 1000;
const memoryCache = new Map();
const inFlightMap = new Map();

function getCached(key) {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  memoryCache.set(key, { data, ts: Date.now() });
  return data;
}

function invalidateCache(prefix = '') {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) memoryCache.delete(key);
  }
}

async function cachedRequest(key, fetcher, force = false) {
  if (!force) {
    const hit = getCached(key);
    if (hit !== null) return hit;
    if (inFlightMap.has(key)) return inFlightMap.get(key);
  }
  const promise = Promise.resolve()
    .then(fetcher)
    .then((res) => {
      setCached(key, res);
      inFlightMap.delete(key);
      return res;
    })
    .catch((err) => {
      inFlightMap.delete(key);
      throw err;
    });
  inFlightMap.set(key, promise);
  return promise;
}

export const DEFAULT_CATEGORIES = [
  { id: 'all', label_uz: 'Tavsiya etilganlar', label_ru: 'Рекомендуемые', label_en: 'Recommended', icon: 'Sparkles', sort_order: 1 },
  { id: 'new', label_uz: 'Yangilar', label_ru: 'Новые', label_en: 'New', icon: 'Sparkles', sort_order: 2 },
  { id: 'food', label_uz: 'Taomlar va ichimliklar', label_ru: 'Еда и напитки', label_en: 'Food & Drinks', icon: 'Utensils', sort_order: 3 },
  { id: 'coffee', label_uz: 'Qahva va shirinlik', label_ru: 'Кофе и десерты', label_en: 'Coffee & Bakery', icon: 'Coffee', sort_order: 4 },
  { id: 'fitness', label_uz: 'Salomatlik va fitnes', label_ru: 'Здоровье и фитнес', label_en: 'Health & Fitness', icon: 'Dumbbell', sort_order: 5 },
  { id: 'barber', label_uz: 'Go‘zallik va sartaroshxona', label_ru: 'Красота и барбершоп', label_en: 'Beauty & Barber', icon: 'Scissors', sort_order: 6 },
  { id: 'education', label_uz: 'Ta’lim va kurslar', label_ru: 'Обучение', label_en: 'Education', icon: 'GraduationCap', sort_order: 7 },
  { id: 'shopping', label_uz: 'Kiyim va xaridlar', label_ru: 'Мода и шопинг', label_en: 'Fashion & Shopping', icon: 'ShoppingBag', sort_order: 8 },
  { id: 'entertainment', label_uz: 'Ko‘ngilochar', label_ru: 'Развлечения', label_en: 'Entertainment', icon: 'Gamepad2', sort_order: 9 },
];

export const ADMIN_PERMISSION_LIST = [
  { id: 'stats', label: 'Statistika' },
  { id: 'students', label: 'Talabalar (Tasdiqlash / Rad etish)' },
  { id: 'deals', label: 'Brend va e’lonlar' },
  { id: 'categories', label: 'Kategoriyalar' },
  { id: 'universities', label: 'Universitetlar' },
  { id: 'messages', label: 'Xabarlar (Yordam / Shikoyatlar)' },
  { id: 'notifications', label: 'Bildirishnomalar yuborish' },
];

export const DEFAULT_FAQ_ITEMS = [
  {
    id: 'faq-1',
    q: '1. Talabalik statusini qanday tasdiqlayman?',
    intro: 'Talabalik statusini tasdiqlash atigi 1 daqiqa vaqt oladi:',
    bullets: [
      '«Mening profilim» sahifasiga o‘tib, «Talabalikni tasdiqlash» tugmasini bosing.',
      'Viloyatingiz va oliy ta’lim muassasangizni ro‘yxatdan tanlang.',
      'Talabalik guvohnomasi (ID karta) yoki HEMIS ma’lumotnomasini yuklang.',
      'Moderatorlarimiz arizangizni tekshirib, statusingizni «Tasdiqlangan» holatiga o‘tkazadi.',
    ],
  },
  {
    id: 'faq-2',
    q: '2. QR-kod yoki promo-kod ishlamasa nima qilish kerak?',
    intro: 'Agar chegirma kodini qo‘llashda muammo yuzaga kelsa:',
    bullets: [
      'Profilingizda «Tasdiqlangan talaba» belgisi yonib turganini tekshiring.',
      'Chegirmani qo‘llash uchun QR-kodni to‘g‘ridan-to‘g‘ri kassirga ko‘rsating.',
      'Muammo hal bo‘lmasa, @imtiyosupport_bot Telegram botimizga murojaat qiling.',
    ],
  },
  {
    id: 'faq-3',
    q: '3. Chegirmalardan necha marta foydalanish mumkin?',
    intro: 'Chegirmalardan foydalanish tartibi hamkor brend turiga qarab belgilanadi:',
    bullets: [
      'Restoran va fast-food chegirmalaridan talabalik davringiz mobaynida cheklanmagan miqdorda foydalanishingiz mumkin.',
      'Maxsus bir martalik bonuslar har bir talaba ID raqami uchun 1 marta taqdim etiladi.',
    ],
  },
  {
    id: 'faq-4',
    q: '4. Mening universitetim ro‘yxatda bo‘lmasa nima qilaman?',
    intro: 'Agar o‘quv yurtingiz asosiy ro‘yxatda chiqmasa:',
    bullets: [
      'Oliy ta’lim muassasalari ro‘yxatining eng pastki qismidagi «Boshqa» bandini tanlang.',
      'Ochilgan «Ta’lim muassasangiz» maydoniga o‘z universitet yoki institut nomini yozing.',
    ],
  },
  {
    id: 'faq-5',
    q: '5. Platformadan foydalanish pullikmi?',
    intro: 'IMTIYO platformasi talabalar uchun to‘liq bepul:',
    bullets: [
      '100% bepul ro‘yxatdan o‘tish va raqamli Talaba ID kartasini olish.',
      'Barcha promo-kodlar va QR-kodlar talabalarga bepul taqdim etiladi.',
    ],
  },
];

export const DEFAULT_SITE_CONTENT = {
  terms: '',
  privacy: '',
  faq: DEFAULT_FAQ_ITEMS,
  about: {
    mode: 'variant1',
    badge: 'Biz haqimizda',
    title: 'O‘zbekiston talabalari uchun yagona imtiyozlar ekotizimi',
    subtitle:
      'IMTIYO — talabalarning kundalik xarajatlarini kamaytirish va maxsus chegirmalar taqdim etish platformasidir.',
    sections: [],
  },
};

const readLocal = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocal = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

export async function autoFitImageFile(file, maxWidth = 1200, maxHeight = 800, quality = 0.86) {
  return new Promise((resolve) => {
    if (!file || !file.type?.startsWith('image/')) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxWidth || h > maxHeight) {
          const ratio = Math.min(maxWidth / w, maxHeight / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(outType, quality));
      };
      img.onerror = () => resolve(String(e.target?.result || ''));
      img.src = String(e.target?.result || '');
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export const generateNumericId = () => String(Math.floor(100000 + Math.random() * 900000));

const cleanStudentId = (rawId) => {
  const digits = String(rawId || '').replace(/\D/g, '');
  if (digits.length >= 5 && digits.length <= 6) return digits;
  if (digits.length > 6) return digits.slice(-6);
  return generateNumericId();
};

const seedActivations = (seedStr) => {
  const str = String(seedStr || 'imtiyo');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) % 1800;
  }
  return 140 + Math.abs(hash);
};

const FALLBACK_COVERS = {
  food: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80',
  coffee: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80',
  fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
  barber: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=80',
  education: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
  shopping: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
  entertainment: 'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=900&q=80',
};

const mapOffer = (r) => {
  const offerExtrasMap = readLocal(STORAGE_KEYS.OFFER_EXTRAS, {});
  const extras = offerExtrasMap[r.id] || {};

  return {
    id: r.id,
    brand_id: r.brand_id,
    brand_name: r.brand_name,
    title: r.title || { uz: r.title_uz || '', ru: r.title_ru || '', en: r.title_en || '' },
    title_uz: r.title_uz || r.title?.uz || '',
    description_uz:
      extras.description_uz ||
      r.description_uz ||
      `${r.title_uz || r.title?.uz || r.brand_name} — tasdiqlangan talabalar uchun maxsus taklif. Kodni faollashtirib hamkor nuqtasida yoki ilovada foydalaning.`,
    terms_uz:
      extras.terms_uz ||
      r.terms_uz ||
      '1. Chegirma faqat tasdiqlangan IMTIYO talabalari uchun amal qiladi.\n2. Kod faollashtirilgandan so‘ng 15 daqiqa davomida kassada yoki ilovada ko‘rsatilishi kerak.\n3. Boshqa aksiyalar bilan qo‘shib hisoblanmaydi.',
    discount: r.discount_label || r.discount || r.title_uz || 'Maxsus taklif',
    redemption: r.redemption_type || r.redemption || 'qr',
    promoCode: r.promo_code || r.promoCode || '',
    deepLink: r.deep_link || r.deepLink || '',
    image_url: r.image_url || extras.image_url || '',
    is_best: Boolean(extras.is_best || r.is_best),
    valid_until: r.valid_until || extras.valid_until || '31/12/2026',
    activations_count:
      typeof r.activations_count === 'number' ? r.activations_count : seedActivations(r.id),
    sortOrder: r.sort_order || 0,
    active: r.active !== false,
  };
};

const mapBrand = (r, allOffersList = []) => {
  const slugOrId = r.slug || r.id;
  const brandExtrasMap = readLocal(STORAGE_KEYS.BRAND_EXTRAS, {});
  const extras = brandExtrasMap[slugOrId] || {};

  const categories = Array.isArray(r.categories)
    ? r.categories
    : String(r.category || 'food')
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

  const primaryCat = categories[0] || 'food';
  const coverUrl =
    r.cover_url || extras.cover_url || FALLBACK_COVERS[primaryCat] || FALLBACK_COVERS.food;

  // Brendning aksiyalaridan "Eng zo'r chegirma" (is_best) yoki 1-aksiyani avtomatik topish
  const brandOffers = allOffersList.filter((o) => String(o.brand_id) === String(slugOrId));
  const bestOffer =
    brandOffers.find((o) => o.is_best) ||
    brandOffers.find((o) => o.id === extras.best_offer_id) ||
    brandOffers[0] ||
    null;

  const autoHeadline =
    bestOffer?.title_uz ||
    bestOffer?.title?.uz ||
    extras.best_offer_title ||
    r.tagline_uz ||
    r.tagline?.uz ||
    r.discount_label ||
    r.discount ||
    `${r.name} talaba chegirmasi`;

  const autoDiscountBadge =
    bestOffer?.discount ||
    bestOffer?.title_uz ||
    extras.best_offer_title ||
    r.discount_label ||
    r.discount ||
    'Maxsus chegirma';

  const autoRedemption = bestOffer?.redemption || r.redemption_type || r.redemption || 'qr';

  // Admin xarita qo'shgan-qo'shmaganligi (has_map)
  const hasMap =
    extras.has_map !== undefined
      ? Boolean(extras.has_map)
      : Array.isArray(extras.locations)
        ? extras.locations.length > 0
        : true;

  return {
    id: slugOrId,
    recordId: r.id,
    name: r.name,
    category: primaryCat,
    categories,
    discount: autoDiscountBadge,
    redemption: autoRedemption,
    best_offer_id: bestOffer?.id || extras.best_offer_id || '',
    appName: r.app_name || r.name,
    deepLink: extras.website !== undefined ? extras.website : r.deep_link || '',
    website: extras.website !== undefined ? extras.website : r.deep_link || '',
    instagram: extras.instagram || r.instagram || '',
    facebook: extras.facebook || r.facebook || '',
    tiktok: extras.tiktok || r.tiktok || '',
    linkedin: extras.linkedin || r.linkedin || '',
    has_map: hasMap,
    custom_locations: Array.isArray(extras.locations) ? extras.locations : null,
    promoPrefix: r.promo_prefix || 'IMTIYO',
    accent: r.accent_color || r.accent || '#002D96',
    accent2: r.accent_color_2 || r.accent2 || '#1D6FF2',
    monogram: r.monogram || (r.name || 'I').slice(0, 2).toUpperCase(),
    logo_url: r.logo_url || extras.logo_url || '',
    cover_url: coverUrl,
    featured: true,
    activations_count:
      typeof r.activations_count === 'number'
        ? r.activations_count
        : seedActivations(slugOrId),
    valid_until: bestOffer?.valid_until || extras.valid_until || '31/12/2026',
    sortOrder: r.sort_order || 0,
    tagline: {
      uz: autoHeadline,
      ru: r.tagline_ru || autoHeadline,
      en: r.tagline_en || autoHeadline,
    },
    description: {
      uz:
        r.description_uz ||
        extras.description_uz ||
        r.description?.uz ||
        `${r.name} — talabalar uchun maxsus chegirma va bonuslar taqdim etuvchi rasmiy hamkor tarmoq.`,
      ru: r.description_ru || '',
      en: r.description_en || '',
    },
  };
};

const mapLocation = (r) => ({
  id: r.id,
  brand_id: r.brand_id,
  brand_name: r.brand_name,
  name: r.name,
  city: r.city || 'Toshkent',
  address: r.address || '',
  lat: Number(r.lat) || 41.311081,
  lng: Number(r.lng) || 69.240562,
});

const mapProfile = (r) => {
  const reviewsMap = readLocal(STORAGE_KEYS.PROFILE_REVIEWS, {});
  const localReview = reviewsMap[r.id] || {};
  const extrasMap = readLocal(STORAGE_KEYS.PROFILE_EXTRAS, {});
  const localExtra =
    extrasMap[r.id] ||
    (r.email ? extrasMap[String(r.email).toLowerCase()] : null) ||
    {};
  const courseVal = normalizeCourse(r.course ?? localExtra.course ?? '');
  const effectiveStatus = r.status || localReview.status || 'unverified';
  const effectiveRejection =
    effectiveStatus === 'rejected'
      ? r.rejection_reason || localReview.rejection_reason || ''
      : '';
  return {
    id: r.id,
    name: r.full_name || r.name || '',
    full_name: r.full_name || r.name || '',
    email: r.email || '',
    phone: r.phone || '',
    university: r.university || '',
    course: courseVal,
    gender: r.gender || '',
    birth_date: r.birth_date || '',
    region: r.region || '',
    avatar_url: r.avatar_url || '',
    password: r.password || '',
    email_verified: Boolean(r.email_verified),
    student_id: cleanStudentId(r.student_id),
    provider: r.provider || 'email',
    status: effectiveStatus,
    document_name: r.document_name || '',
    document_url: r.document_url || '',
    submitted_date: r.submitted_date || '',
    created_at: r.created_at || r.submitted_date || '',
    last_login: r.last_login || r.created_at || r.submitted_date || '',
    rejection_reason: effectiveRejection,
    reviewed_by: r.reviewed_by || localReview.reviewed_by || '',
    reviewed_at: r.reviewed_at || localReview.reviewed_at || '',
  };
};

let seedPromise = null;
async function ensureInitialSeed() {
  try {
    if (sessionStorage.getItem('imtiyo_seed_checked_v1') === '1') return;
  } catch {
    /* ignore */
  }
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      const { count } = await supabase
        .from('brands')
        .select('id', { count: 'exact', head: true });
      if (count === 0) {
        const brandRows = sampleBrands.map((b) => ({
          id: b.id,
          slug: b.id,
          name: b.name,
          category: b.category,
          discount_label: b.discount,
          redemption_type: b.redemption,
          app_name: b.appName || b.name,
          deep_link: b.deepLink || '',
          promo_prefix: b.promoPrefix || 'IMTIYO',
          accent_color: b.accent,
          accent_color_2: b.accent2,
          monogram: b.monogram,
          logo_url: b.logo_url || '',
          cover_url: b.cover_url || '',
          featured: Boolean(b.featured),
          activations_count: seedActivations(b.id),
          sort_order: b.sortOrder || 0,
          tagline_uz: b.tagline?.uz || '',
          tagline_ru: b.tagline?.ru || '',
          tagline_en: b.tagline?.en || '',
          description_uz: b.description?.uz || '',
          description_ru: b.description?.ru || '',
          description_en: b.description?.en || '',
        }));
        await supabase.from('brands').upsert(brandRows);

        const offerRows = sampleOffers.map((o) => ({
          id: o.id,
          brand_id: o.brand_id,
          brand_name: o.brand_name || '',
          title_uz: o.title?.uz || '',
          title_ru: o.title?.ru || '',
          title_en: o.title?.en || '',
          discount_label: o.discount,
          redemption_type: o.redemption,
          promo_code: o.promoCode || '',
          deep_link: o.deepLink || '',
          section_group: o.section_group || 'recommended',
          activations_count: seedActivations(o.id),
          sort_order: o.sortOrder || 0,
          active: true,
        }));
        await supabase.from('offers').upsert(offerRows);

        const locRows = sampleLocations.map((l) => ({
          id: l.id,
          brand_id: l.brand_id,
          brand_name: l.brand_name || '',
          name: l.name,
          city: l.city,
          address: l.address,
          lat: l.lat,
          lng: l.lng,
        }));
        await supabase.from('locations').upsert(locRows);
      }
      try {
        sessionStorage.setItem('imtiyo_seed_checked_v1', '1');
      } catch {
        /* ignore */
      }
    } catch {
      /* fallback */
    }
  })();
  return seedPromise;
}

export const api = {
  async uploadFile(file, folder = 'docs', resizeOpts = null) {
    if (file?.type?.startsWith('image/')) {
      const maxW = resizeOpts?.maxWidth || 1200;
      const maxH = resizeOpts?.maxHeight || 800;
      const fittedDataUrl = await autoFitImageFile(file, maxW, maxH);
      try {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage
          .from('imtiyo-files')
          .upload(path, file, { upsert: true });
        if (!error) {
          const { data } = supabase.storage.from('imtiyo-files').getPublicUrl(path);
          return data.publicUrl;
        }
      } catch {
        /* fallback */
      }
      if (fittedDataUrl) return fittedDataUrl;
    }

    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from('imtiyo-files')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('imtiyo-files').getPublicUrl(path);
    return data.publicUrl;
  },

  async getSiteContent() {
    return DEFAULT_SITE_CONTENT;
  },

  // --- EMAIL & TELEGRAM OTP ---
  async sendEmailOtpViaResend(email) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 10 * 60 * 1000;

    writeLocal(`imtiyo_email_otp_${cleanEmail}`, { code, expiresAt });
    try {
      await supabase.from('otp_codes').upsert(
        {
          target: cleanEmail,
          code,
          channel: 'email',
          expires_at: new Date(expiresAt).toISOString(),
        },
        { onConflict: 'target' }
      );
    } catch {
      /* ignore */
    }

    try {
      const { data: fnData, error: fnErr } = await supabase.functions.invoke('send-email-otp', {
        body: { email: cleanEmail, code },
      });
      if (!fnErr && fnData?.ok) return { ok: true };
    } catch {
      /* continue */
    }

    try {
      const { error: supaErr } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { shouldCreateUser: true },
      });
      if (!supaErr) return { ok: true };
    } catch {
      /* continue */
    }

    return { ok: true, code };
  },

  async verifyEmailOtpCode(email, enteredCode) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanCode = String(enteredCode || '').trim();

    const saved = readLocal(`imtiyo_email_otp_${cleanEmail}`, null);
    if (saved && saved.code === cleanCode && Date.now() < saved.expiresAt) {
      localStorage.removeItem(`imtiyo_email_otp_${cleanEmail}`);
      return true;
    }

    try {
      const { data } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('target', cleanEmail)
        .eq('code', cleanCode)
        .maybeSingle();
      if (data) {
        await supabase.from('otp_codes').delete().eq('target', cleanEmail);
        return true;
      }
    } catch {
      /* ignore */
    }

    const { error: err1 } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanCode,
      type: 'email',
    });
    if (!err1) return true;

    const { error: err2 } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanCode,
      type: 'signup',
    });
    return !err2;
  },

  async initTelegramOtpSession(phoneFormatted, forceNew = false) {
    const digits = String(phoneFormatted || '').replace(/\D/g, '').slice(-9);
    const storageKey = `imtiyo_tg_otp_${digits}`;
    const existing = readLocal(storageKey, null);
    const now = Date.now();

    let code;
    let expiresAt;
    if (!forceNew && existing && existing.code && existing.expiresAt > now) {
      code = existing.code;
      expiresAt = existing.expiresAt;
    } else {
      code = String(Math.floor(100000 + Math.random() * 900000));
      expiresAt = now + 60 * 1000;
    }

    const expSec = Math.floor(expiresAt / 1000);
    const rawPayload = `${digits}_${code}_${expSec}`;
    const encodedToken =
      's_' +
      rawPayload
        .split('')
        .map((ch) => ch.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('');

    writeLocal(storageKey, {
      code,
      sessionToken: encodedToken,
      expiresAt,
      createdAt: now,
    });

    try {
      await supabase.from('otp_codes').upsert(
        {
          target: `+998${digits}`,
          code,
          channel: 'telegram',
          session_token: encodedToken,
          expires_at: new Date(expiresAt).toISOString(),
        },
        { onConflict: 'target' }
      );
    } catch {
      /* ignore */
    }

    const botUsername = (
      import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'imtiyokod_bot'
    ).replace(/^@/, '');

    return {
      botUsername,
      sessionToken: encodedToken,
      code,
      expiresAt,
      deepLink: `https://t.me/${botUsername}?start=${encodedToken}`,
    };
  },

  async pollTelegramBotAndSendCode() {
    return { sent: false };
  },

  async verifyPhoneOtpCode(phoneFormatted, enteredCode) {
    const digits = String(phoneFormatted || '').replace(/\D/g, '').slice(-9);
    const cleanCode = String(enteredCode || '').trim();
    const storageKey = `imtiyo_tg_otp_${digits}`;

    const saved = readLocal(storageKey, null);
    if (saved && saved.code === cleanCode) {
      if (Date.now() > saved.expiresAt) {
        throw new Error(
          'Kodning amal qilish muddati (1 daqiqa) tugagan! «Kodni qayta yuborish» ni bosing.'
        );
      }
      localStorage.removeItem(storageKey);
      return true;
    }

    try {
      const { data } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('target', `+998${digits}`)
        .eq('code', cleanCode)
        .maybeSingle();
      if (data) {
        if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
          throw new Error(
            'Kodning amal qilish muddati (1 daqiqa) tugagan! «Kodni qayta yuborish» ni bosing.'
          );
        }
        await supabase.from('otp_codes').delete().eq('target', `+998${digits}`);
        return true;
      }
    } catch (err) {
      if (err.message?.includes('muddati')) throw err;
    }
    return false;
  },

  // --- CATEGORIES ---
  async listCategories(force = false) {
    return cachedRequest(
      'categories',
      async () => {
        try {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('sort_order', { ascending: true });
          if (!error && Array.isArray(data) && data.length > 0) {
            writeLocal(STORAGE_KEYS.CATEGORIES, data);
            return data;
          }
        } catch {
          /* fallback */
        }
        const local = readLocal(STORAGE_KEYS.CATEGORIES, null);
        if (Array.isArray(local) && local.length > 0) {
          return [...local].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        }
        writeLocal(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
        return DEFAULT_CATEGORIES;
      },
      force
    );
  },

  async saveCategory(cat) {
    const current = await this.listCategories();
    const cleanId = (cat.id || cat.label_uz || 'cat-' + Date.now())
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-');

    const record = {
      id: cleanId,
      label_uz: (cat.label_uz || '').trim() || 'Yangi kategoriya',
      label_ru: (cat.label_ru || cat.label_uz || '').trim(),
      label_en: (cat.label_en || cat.label_uz || '').trim(),
      icon: cat.icon || 'Sparkles',
      sort_order:
        typeof cat.sort_order === 'number' ? cat.sort_order : current.length + 1,
    };

    const existsIdx = current.findIndex((c) => c.id === record.id);
    const next =
      existsIdx >= 0
        ? current.map((c, idx) => (idx === existsIdx ? { ...c, ...record } : c))
        : [...current, record];

    writeLocal(STORAGE_KEYS.CATEGORIES, next);
    setCached('categories', next);
    try {
      await supabase.from('categories').upsert(record, { onConflict: 'id' });
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event('imtiyo_categories_changed'));
    return next;
  },

  async deleteCategory(catId) {
    if (catId === 'all') return this.listCategories();
    const current = await this.listCategories();
    const next = current.filter((c) => c.id !== catId);
    writeLocal(STORAGE_KEYS.CATEGORIES, next);
    setCached('categories', next);
    try {
      await supabase.from('categories').delete().eq('id', catId);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event('imtiyo_categories_changed'));
    return next;
  },

  async reorderCategories(orderedList) {
    const normalized = orderedList.map((c, idx) => ({ ...c, sort_order: idx + 1 }));
    writeLocal(STORAGE_KEYS.CATEGORIES, normalized);
    setCached('categories', normalized);
    try {
      await supabase.from('categories').upsert(normalized, { onConflict: 'id' });
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event('imtiyo_categories_changed'));
    return normalized;
  },

  // --- BRANDS ---
  async listBrands(force = false) {
    return cachedRequest(
      'brands:all',
      async () => {
        await ensureInitialSeed();
        const [brandsRes, allOffers] = await Promise.all([
          supabase.from('brands').select('*').order('sort_order', { ascending: false }),
          this.listAllOffers(force).catch(() => []),
        ]);
        const rawBrands = brandsRes.error || !brandsRes.data ? sampleBrands : brandsRes.data;
        return rawBrands.map((b) => mapBrand(b, allOffers));
      },
      force
    );
  },

  async getBrand(slug, force = false) {
    if (!force) {
      const cachedBrands = getCached('brands:all');
      if (Array.isArray(cachedBrands)) {
        const match = cachedBrands.find((b) => String(b.id) === String(slug));
        if (match) return match;
      }
    }
    return cachedRequest(
      `brand:${slug}`,
      async () => {
        const [brandRes, brandOffers] = await Promise.all([
          supabase.from('brands').select('*').or(`slug.eq.${slug},id.eq.${slug}`).maybeSingle(),
          this.listOffers(slug).catch(() => []),
        ]);
        if (brandRes.data) return mapBrand(brandRes.data, brandOffers);
        const fallback = sampleBrands.find((b) => b.id === slug);
        return fallback ? mapBrand(fallback, brandOffers) : null;
      },
      force
    );
  },

  prefetchBrand(slug) {
    if (!slug) return;
    this.getBrand(slug).catch(() => {});
    this.listOffers(slug).catch(() => {});
    this.listLocations(slug).catch(() => {});
  },

  async createBrand(data) {
    const id = data.slug || 'brand-' + Date.now();
    const hasMap = Boolean(data.has_map);
    const locList = hasMap && Array.isArray(data.locations) ? data.locations : [];

    const brandExtrasMap = readLocal(STORAGE_KEYS.BRAND_EXTRAS, {});
    brandExtrasMap[id] = {
      website: data.website || '',
      instagram: data.instagram || '',
      facebook: data.facebook || '',
      tiktok: data.tiktok || '',
      linkedin: data.linkedin || '',
      logo_url: data.logo_url || '',
      cover_url: data.cover_url || '',
      description_uz: data.description_uz || '',
      has_map: hasMap,
      locations: locList,
    };
    writeLocal(STORAGE_KEYS.BRAND_EXTRAS, brandExtrasMap);

    const record = {
      id,
      slug: id,
      name: data.name,
      category:
        Array.isArray(data.categories) && data.categories.length
          ? data.categories.join(',')
          : data.category || 'food',
      discount_label: data.discount_label || 'Yangi',
      redemption_type: 'qr',
      app_name: data.name,
      deep_link: data.website || '',
      promo_prefix: 'IMTIYO',
      accent_color: data.accent_color || '#002D96',
      accent_color_2: data.accent_color_2 || '#1D6FF2',
      monogram: data.monogram || data.name.slice(0, 2).toUpperCase(),
      logo_url: data.logo_url || '',
      cover_url: data.cover_url || '',
      tagline_uz: data.tagline_uz || '',
      description_uz: data.description_uz || '',
      featured: true,
      activations_count: 0,
      sort_order: 50,
    };

    // Filiallarni locations jadvaliga ham saqlash
    if (hasMap && locList.length > 0) {
      try {
        await supabase.from('locations').delete().eq('brand_id', id);
        const rows = locList.map((l, idx) => ({
          id: l.id || `loc-${id}-${Date.now()}-${idx}`,
          brand_id: id,
          brand_name: data.name,
          name: l.name || `${data.name} filiali`,
          city: l.city || 'Toshkent',
          address: l.address || '',
          lat: Number(l.lat) || 41.311081,
          lng: Number(l.lng) || 69.240562,
        }));
        await supabase.from('locations').insert(rows);
      } catch {
        /* ignore */
      }
    }

    const { data: inserted, error } = await supabase
      .from('brands')
      .insert(record)
      .select()
      .single();
    invalidateCache('brands:');
    invalidateCache('brand:');
    invalidateCache('locations:');
    if (error) return mapBrand(record, []);
    return mapBrand(inserted, []);
  },

  async updateBrand(brandId, data) {
    const payload = { ...data };
    const brandExtrasMap = readLocal(STORAGE_KEYS.BRAND_EXTRAS, {});
    const prevExtras = brandExtrasMap[brandId] || {};

    const hasMap =
      payload.has_map !== undefined ? Boolean(payload.has_map) : Boolean(prevExtras.has_map);
    const locList =
      payload.locations !== undefined
        ? hasMap
          ? payload.locations
          : []
        : prevExtras.locations || [];

    brandExtrasMap[brandId] = {
      ...prevExtras,
      ...(payload.website !== undefined ? { website: payload.website } : {}),
      ...(payload.instagram !== undefined ? { instagram: payload.instagram } : {}),
      ...(payload.facebook !== undefined ? { facebook: payload.facebook } : {}),
      ...(payload.tiktok !== undefined ? { tiktok: payload.tiktok } : {}),
      ...(payload.linkedin !== undefined ? { linkedin: payload.linkedin } : {}),
      ...(payload.logo_url !== undefined ? { logo_url: payload.logo_url } : {}),
      ...(payload.cover_url !== undefined ? { cover_url: payload.cover_url } : {}),
      ...(payload.description_uz !== undefined ? { description_uz: payload.description_uz } : {}),
      ...(payload.best_offer_id !== undefined ? { best_offer_id: payload.best_offer_id } : {}),
      ...(payload.best_offer_title !== undefined
        ? { best_offer_title: payload.best_offer_title }
        : {}),
      has_map: hasMap,
      locations: locList,
    };
    writeLocal(STORAGE_KEYS.BRAND_EXTRAS, brandExtrasMap);

    if (payload.locations !== undefined) {
      try {
        await supabase.from('locations').delete().eq('brand_id', brandId);
        if (hasMap && locList.length > 0) {
          const rows = locList.map((l, idx) => ({
            id: l.id || `loc-${brandId}-${Date.now()}-${idx}`,
            brand_id: brandId,
            brand_name: payload.name || '',
            name: l.name || `${payload.name || 'Filial'}`,
            city: l.city || 'Toshkent',
            address: l.address || '',
            lat: Number(l.lat) || 41.311081,
            lng: Number(l.lng) || 69.240562,
          }));
          await supabase.from('locations').insert(rows);
        }
      } catch {
        /* ignore */
      }
    }

    if (Array.isArray(payload.categories)) {
      payload.category = payload.categories.join(',');
      delete payload.categories;
    }

    delete payload.website;
    delete payload.instagram;
    delete payload.facebook;
    delete payload.tiktok;
    delete payload.linkedin;
    delete payload.has_map;
    delete payload.locations;
    delete payload.best_offer_id;
    delete payload.best_offer_title;
    delete payload.sections;

    const { data: updated, error } = await supabase
      .from('brands')
      .update(payload)
      .or(`slug.eq.${brandId},id.eq.${brandId}`)
      .select()
      .maybeSingle();

    const offers = await this.listOffers(brandId, true).catch(() => []);
    invalidateCache('brands:');
    invalidateCache('brand:');
    invalidateCache('locations:');
    if (error || !updated) {
      const existing = await this.getBrand(brandId, true);
      return existing ? mapBrand({ ...existing, ...payload }, offers) : null;
    }
    return mapBrand(updated, offers);
  },

  async deleteBrand(brandId) {
    await supabase.from('offers').delete().eq('brand_id', brandId);
    await supabase.from('locations').delete().eq('brand_id', brandId);
    await supabase.from('brands').delete().or(`slug.eq.${brandId},id.eq.${brandId}`);
    invalidateCache('brands:');
    invalidateCache('brand:');
    invalidateCache('offers:');
    invalidateCache('locations:');
    return true;
  },

  // --- LOCATIONS ---
  async listLocations(brandId = null, force = false) {
    const cacheKey = `locations:${brandId || 'all'}`;
    return cachedRequest(
      cacheKey,
      async () => {
        await ensureInitialSeed();
        if (brandId) {
          const brandExtrasMap = readLocal(STORAGE_KEYS.BRAND_EXTRAS, {});
          const extras = brandExtrasMap[brandId];
          if (extras && extras.has_map === false) return [];
          if (extras && Array.isArray(extras.locations) && extras.locations.length > 0) {
            return extras.locations.map(mapLocation);
          }
        }
        let q = supabase.from('locations').select('*');
        if (brandId) q = q.eq('brand_id', brandId);
        const { data, error } = await q;
        if (error || !data) {
          const fallback = brandId
            ? sampleLocations.filter((l) => String(l.brand_id) === String(brandId))
            : sampleLocations;
          return fallback.map(mapLocation);
        }
        return data.map(mapLocation);
      },
      force
    );
  },

  // --- OFFERS ---
  async listOffers(brandId, force = false) {
    return cachedRequest(
      `offers:${brandId}`,
      async () => {
        const { data, error } = await supabase
          .from('offers')
          .select('*')
          .eq('brand_id', brandId)
          .order('sort_order', { ascending: false });
        if (error || !data) {
          return sampleOffers
            .filter((o) => String(o.brand_id) === String(brandId))
            .map(mapOffer);
        }
        return data.map(mapOffer);
      },
      force
    );
  },

  async listAllOffers(force = false) {
    return cachedRequest(
      'offers:all',
      async () => {
        await ensureInitialSeed();
        const { data, error } = await supabase
          .from('offers')
          .select('*')
          .order('sort_order', { ascending: false });
        if (error || !data) return sampleOffers.map(mapOffer);
        return data.map(mapOffer);
      },
      force
    );
  },

  async createOffer(data) {
    const id = 'offer-' + Date.now();
    const isBest = Boolean(data.is_best);

    const offerExtrasMap = readLocal(STORAGE_KEYS.OFFER_EXTRAS, {});
    if (isBest && data.brand_id) {
      // Boshqa chegirmalardan is_best bayrog'ini olib tashlaymiz
      Object.keys(offerExtrasMap).forEach((k) => {
        if (offerExtrasMap[k]?.brand_id === data.brand_id) {
          offerExtrasMap[k].is_best = false;
        }
      });
    }
    offerExtrasMap[id] = {
      brand_id: data.brand_id,
      image_url: data.image_url || '',
      valid_until: data.valid_until || '31/12/2026',
      description_uz: data.description_uz || '',
      terms_uz: data.terms_uz || '',
      is_best: isBest,
    };
    writeLocal(STORAGE_KEYS.OFFER_EXTRAS, offerExtrasMap);

    const record = {
      id,
      brand_id: data.brand_id,
      brand_name: data.brand_name || '',
      title_uz: data.title_uz || '',
      title_ru: data.title_ru || data.title_uz || '',
      title_en: data.title_en || data.title_uz || '',
      discount_label: data.discount_label || data.title_uz || 'Maxsus taklif',
      redemption_type: data.redemption_type || 'qr',
      promo_code: data.promo_code || '',
      deep_link: data.deep_link || '',
      section_group: 'recommended',
      valid_until: data.valid_until || '31/12/2026',
      activations_count: 0,
      sort_order: isBest ? 100 : 90,
      active: true,
    };

    const { data: inserted, error } = await supabase
      .from('offers')
      .insert(record)
      .select()
      .single();

    // Agar "Eng zo'r chegirma" bo'lsa yoki brendning 1-chegirmasi bo'lsa, brend yorlig'ini avtomatik yangilaymiz
    invalidateCache('offers:');
    invalidateCache('brands:');
    invalidateCache('brand:');
    const existingOffers = await this.listOffers(data.brand_id, true).catch(() => []);
    if (isBest || existingOffers.length <= 1) {
      await this.setBestOfferForBrand(data.brand_id, id, data.title_uz);
    }

    if (error) return mapOffer({ ...record, ...offerExtrasMap[id] });
    return mapOffer({ ...inserted, ...offerExtrasMap[id] });
  },

  async setBestOfferForBrand(brandId, offerId, offerTitle = '') {
    const offerExtrasMap = readLocal(STORAGE_KEYS.OFFER_EXTRAS, {});
    const brandOffers = await this.listOffers(brandId, true).catch(() => []);
    brandOffers.forEach((o) => {
      offerExtrasMap[o.id] = {
        ...(offerExtrasMap[o.id] || {}),
        brand_id: brandId,
        is_best: o.id === offerId,
      };
    });
    writeLocal(STORAGE_KEYS.OFFER_EXTRAS, offerExtrasMap);

    const targetOffer = brandOffers.find((o) => o.id === offerId);
    const bestTitle =
      offerTitle || targetOffer?.title_uz || targetOffer?.discount || 'Maxsus chegirma';

    await this.updateBrand(brandId, {
      discount_label: bestTitle,
      tagline_uz: bestTitle,
      best_offer_id: offerId,
      best_offer_title: bestTitle,
    });
    invalidateCache('offers:');
    invalidateCache('brands:');
    invalidateCache('brand:');
    return true;
  },

  async deleteOffer(id) {
    await supabase.from('offers').delete().eq('id', id);
    invalidateCache('offers:');
    invalidateCache('brands:');
    invalidateCache('brand:');
    return true;
  },

  // --- PROFILES ---
  async getDemoProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    if (data && data[0]) return mapProfile(data[0]);
    return mapProfile(DEMO_STUDENT);
  },

  // Deterministik asosiy profil tanlovchi: bir xil email/telefon bilan bir nechta
  // eski dublikat yozuvlar bo'lsa ham, HAR DOIM bitta ayni asosiy profilni qaytaradi
  // (last_login yoki Postgres heap tartibiga bog'liq bo'lmaydi!)
  pickPrimaryProfile(rows = []) {
    const valid = (Array.isArray(rows) ? rows : []).filter(Boolean);
    if (valid.length === 0) return null;
    if (valid.length === 1) return mapProfile(valid[0]);

    const statusScore = (s) => {
      if (s === 'verified') return 1000;
      if (s === 'pending') return 500;
      if (s === 'rejected') return 200;
      return 0;
    };

    const scoreRow = (r) => {
      const m = mapProfile(r);
      let score = statusScore(m.status);
      const nameVal = String(m.full_name || m.name || '').trim();
      if (nameVal && nameVal.toLowerCase() !== 'talaba') score += 50;
      if (m.university) score += 40;
      if (m.document_url) score += 35;
      if (m.phone) score += 30;
      if (m.region) score += 20;
      if (m.birth_date) score += 20;
      if (m.course) score += 15;
      if (m.gender) score += 10;
      if (m.avatar_url) score += 10;
      if (m.email) score += 10;
      return score;
    };

    const sorted = [...valid].sort((a, b) => {
      const diff = scoreRow(b) - scoreRow(a);
      if (diff !== 0) return diff;
      // Teng bo'lsa — eng eski (birinchi ochilgan) profil ustun
      const timeA = new Date(a.created_at || 0).getTime() || Number.MAX_SAFE_INTEGER;
      const timeB = new Date(b.created_at || 0).getTime() || Number.MAX_SAFE_INTEGER;
      if (timeA !== timeB) return timeA - timeB;
      return String(a.id || '').localeCompare(String(b.id || ''));
    });

    const primary = mapProfile(sorted[0]);

    // Agar eski dublikatlarda asosiy profilda bo'sh qolgan maydonlar bo'lsa (email/phone/password),
    // ularni yo'qotmasdan asosiy profilga birlashtirib berish
    const merged = { ...primary };
    for (let i = 1; i < sorted.length; i += 1) {
      const dup = mapProfile(sorted[i]);
      if (!merged.email && dup.email) merged.email = dup.email;
      if (!merged.phone && dup.phone) merged.phone = dup.phone;
      if (!merged.university && dup.university) merged.university = dup.university;
      if (!merged.region && dup.region) merged.region = dup.region;
      if (!merged.course && dup.course) merged.course = dup.course;
      if (!merged.birth_date && dup.birth_date) merged.birth_date = dup.birth_date;
      if (!merged.gender && dup.gender) merged.gender = dup.gender;
      if (!merged.avatar_url && dup.avatar_url) merged.avatar_url = dup.avatar_url;
      if (!merged.password && dup.password) merged.password = dup.password;
      if ((!merged.full_name || merged.full_name === 'Talaba') && dup.full_name && dup.full_name !== 'Talaba') {
        merged.full_name = dup.full_name;
        merged.name = dup.full_name;
      }
    }

    return merged;
  },

  async findProfile({ id = '', email = '', phone = '' } = {}) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const digits = String(phone || '').replace(/\D/g, '').slice(-9);
    const localList = readLocal(STORAGE_KEYS.LOCAL_PROFILES, []);

    const candidatesMap = new Map();
    const addCandidate = (row) => {
      if (row && row.id) {
        const key = String(row.id);
        if (!candidatesMap.has(key)) candidatesMap.set(key, row);
      }
    };

    const fetchByEmail = async (em) => {
      const normalized = String(em || '').trim().toLowerCase();
      if (!normalized) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', normalized)
          .order('created_at', { ascending: true })
          .limit(25);
        if (Array.isArray(data)) {
          data.forEach((row) => {
            if (row && String(row.email || '').trim().toLowerCase() === normalized) {
              addCandidate(row);
            }
          });
        }
      } catch {
        /* ignore */
      }
      if (Array.isArray(localList)) {
        localList.forEach((row) => {
          if (row && String(row.email || '').trim().toLowerCase() === normalized) {
            addCandidate(row);
          }
        });
      }
    };

    const fetchByPhoneDigits = async (phDigits) => {
      const d = String(phDigits || '').replace(/\D/g, '').slice(-9);
      if (d.length !== 9) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .ilike('phone', `%${d.slice(-4)}`)
          .order('created_at', { ascending: true })
          .limit(25);
        if (Array.isArray(data)) {
          data.forEach((row) => {
            if (row?.phone && row.phone.replace(/\D/g, '').slice(-9) === d) {
              addCandidate(row);
            }
          });
        }
      } catch {
        /* ignore */
      }
      if (Array.isArray(localList)) {
        localList.forEach((row) => {
          if (row?.phone && row.phone.replace(/\D/g, '').slice(-9) === d) {
            addCandidate(row);
          }
        });
      }
    };

    try {
      // 1. Aniq ID berilgan bo'lsa — avval shu ID bo'yicha olish (reload() tez ishlashi uchun)
      if (id && !cleanEmail && digits.length !== 9) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (data) return mapProfile(data);
        if (Array.isArray(localList)) {
          const localById = localList.find((p) => p && String(p.id) === String(id));
          if (localById) return mapProfile(localById);
        }
      }

      if (id) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (data) addCandidate(data);
        if (Array.isArray(localList)) {
          const localById = localList.find((p) => p && String(p.id) === String(id));
          if (localById) addCandidate(localById);
        }
      }

      // 2. Email va telefon bo'yicha barcha mos yozuvlarni yig'ish
      await Promise.all([
        cleanEmail ? fetchByEmail(cleanEmail) : Promise.resolve(),
        digits.length === 9 ? fetchByPhoneDigits(digits) : Promise.resolve(),
      ]);

      // 3. Tranzitiv bog'lanish (1 qadam): email orqali topilgan profildagi telefon raqam
      // yoki telefon orqali topilgan profildagi email orqali ham bir odamning barcha yozuvlarini topish!
      const queriedEmails = new Set(cleanEmail ? [cleanEmail] : []);
      const queriedPhones = new Set(digits.length === 9 ? [digits] : []);
      const extraTasks = [];

      candidatesMap.forEach((row) => {
        const rowEmail = String(row.email || '').trim().toLowerCase();
        const rowPhoneDigits = String(row.phone || '').replace(/\D/g, '').slice(-9);
        if (rowEmail && !queriedEmails.has(rowEmail)) {
          queriedEmails.add(rowEmail);
          extraTasks.push(fetchByEmail(rowEmail));
        }
        if (rowPhoneDigits.length === 9 && !queriedPhones.has(rowPhoneDigits)) {
          queriedPhones.add(rowPhoneDigits);
          extraTasks.push(fetchByPhoneDigits(rowPhoneDigits));
        }
      });

      if (extraTasks.length > 0) {
        await Promise.all(extraTasks);
      }

      if (candidatesMap.size > 0) {
        const allRows = Array.from(candidatesMap.values());
        const primary = this.pickPrimaryProfile(allRows);
        // Agar primary yozuvda yo'q bo'lgan email/phone boshqa dublikatdan birlashtirilgan bo'lsa,
        // bazadagi primary qatorga ham saqlab qo'yish (keyingi safar darhol topiladi)
        const rawPrimary = allRows.find((r) => String(r.id) === String(primary.id));
        if (rawPrimary && primary?.id) {
          const syncBack = {};
          if (!rawPrimary.email && primary.email) syncBack.email = primary.email;
          if (!rawPrimary.phone && primary.phone) syncBack.phone = primary.phone;
          if (Object.keys(syncBack).length > 0) {
            this.saveProfile(primary.id, syncBack).catch(() => {});
          }
        }
        return primary;
      }
    } catch {
      /* fallback to local cache */
    }

    // Fallback: lokal profillar keshidan qidirish
    if (Array.isArray(localList) && localList.length > 0) {
      const hits = localList.filter((p) => {
        if (!p) return false;
        if (id && String(p.id) === String(id)) return true;
        if (cleanEmail && String(p.email || '').trim().toLowerCase() === cleanEmail) return true;
        if (digits.length === 9 && String(p.phone || '').replace(/\D/g, '').slice(-9) === digits) {
          return true;
        }
        return false;
      });
      if (hits.length > 0) return this.pickPrimaryProfile(hits);
    }
    return null;
  },

  async listProfiles() {
    const localList = readLocal(STORAGE_KEYS.LOCAL_PROFILES, []);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) {
      return Array.isArray(localList) ? localList.map(mapProfile) : [];
    }
    return data.map(mapProfile);
  },

  async createProfile(data) {
    const cleanEmail = String(data.email || '').trim().toLowerCase();
    const cleanPhone = String(data.phone || '').trim();

    // Takroriy (dublikat) profil yaratilishidan yakuniy himoya
    if (cleanEmail || cleanPhone.replace(/\D/g, '').length >= 9) {
      const alreadyExists = await this.findProfile({
        email: cleanEmail,
        phone: cleanPhone,
      }).catch(() => null);
      if (alreadyExists) {
        return alreadyExists;
      }
    }

    const now = new Date().toISOString();
    const courseStr = normalizeCourse(data.course);
    const id = 'stu-' + Date.now();
    const record = {
      id,
      full_name: data.full_name || data.name || 'Talaba',
      email: cleanEmail,
      phone: cleanPhone,
      university: data.university || '',
      course: courseStr ? Number(courseStr) : null,
      gender: data.gender || '',
      birth_date: data.birth_date || '',
      region: data.region || '',
      avatar_url: data.avatar_url || '',
      student_id: cleanStudentId(data.student_id),
      provider: data.provider || 'email',
      status: data.status || 'unverified',
      document_name: data.document_name || '',
      document_url: data.document_url || '',
      submitted_date: data.submitted_date || null,
      created_at: now,
      last_login: now,
      rejection_reason: '',
    };

    // Lokal profillar keshiga ham yozib qo'yish (takroriy ro'yxatdan o'tishni bloklash va offline rejim uchun)
    const localList = readLocal(STORAGE_KEYS.LOCAL_PROFILES, []);
    writeLocal(STORAGE_KEYS.LOCAL_PROFILES, [
      record,
      ...(Array.isArray(localList) ? localList.filter((p) => p?.id !== id) : []),
    ]);

    if (courseStr) {
      const extrasMap = readLocal(STORAGE_KEYS.PROFILE_EXTRAS, {});
      extrasMap[id] = { ...(extrasMap[id] || {}), course: courseStr };
      if (record.email) {
        extrasMap[record.email.toLowerCase()] = {
          ...(extrasMap[record.email.toLowerCase()] || {}),
          course: courseStr,
        };
      }
      writeLocal(STORAGE_KEYS.PROFILE_EXTRAS, extrasMap);
    }

    const { data: inserted, error } = await supabase
      .from('profiles')
      .insert(record)
      .select()
      .single();
    if (error) {
      // Fallback if DB column `course` migration has not been applied yet
      const safeRecord = { ...record };
      delete safeRecord.course;
      const { data: retryInserted } = await supabase
        .from('profiles')
        .insert(safeRecord)
        .select()
        .single();
      return mapProfile(retryInserted ? { ...retryInserted, course: courseStr } : record);
    }
    return mapProfile(inserted);
  },

  async saveProfile(id, data) {
    const payload = { ...data };
    if (payload.name && !payload.full_name) {
      payload.full_name = payload.name;
      delete payload.name;
    } else if ('name' in payload) {
      delete payload.name;
    }

    // Lokal profillar keshini ham sinxron yangilab borish
    try {
      const localList = readLocal(STORAGE_KEYS.LOCAL_PROFILES, []);
      if (Array.isArray(localList) && localList.some((p) => String(p?.id) === String(id))) {
        writeLocal(
          STORAGE_KEYS.LOCAL_PROFILES,
          localList.map((p) => (String(p?.id) === String(id) ? { ...p, ...payload } : p))
        );
      }
    } catch {
      /* ignore */
    }

    if ('course' in payload) {
      const courseStr = normalizeCourse(payload.course);
      payload.course = courseStr ? Number(courseStr) : null;
      const extrasMap = readLocal(STORAGE_KEYS.PROFILE_EXTRAS, {});
      extrasMap[id] = { ...(extrasMap[id] || {}), course: courseStr };
      writeLocal(STORAGE_KEYS.PROFILE_EXTRAS, extrasMap);
    }

    if ('status' in payload || 'rejection_reason' in payload || 'reviewed_by' in payload) {
      const reviewsMap = readLocal(STORAGE_KEYS.PROFILE_REVIEWS, {});
      const nextStatus = payload.status ?? reviewsMap[id]?.status;
      reviewsMap[id] = {
        ...(reviewsMap[id] || {}),
        ...(nextStatus !== undefined ? { status: nextStatus } : {}),
        ...(payload.rejection_reason !== undefined
          ? { rejection_reason: payload.rejection_reason }
          : nextStatus && nextStatus !== 'rejected'
            ? { rejection_reason: '' }
            : {}),
        ...(payload.reviewed_by !== undefined ? { reviewed_by: payload.reviewed_by } : {}),
        reviewed_at: new Date().toISOString(),
      };
      writeLocal(STORAGE_KEYS.PROFILE_REVIEWS, reviewsMap);

      // Agar shu qurilmada ayni talaba login bo'lgan bo'lsa, profil keshini ham darhol yangilash
      try {
        const storedRaw = localStorage.getItem('imtiyo_student_profile_v2');
        if (storedRaw) {
          const stored = JSON.parse(storedRaw);
          if (stored && String(stored.id) === String(id)) {
            const patched = {
              ...stored,
              ...(nextStatus !== undefined ? { status: nextStatus } : {}),
              rejection_reason:
                nextStatus === 'rejected'
                  ? payload.rejection_reason ?? stored.rejection_reason ?? ''
                  : nextStatus
                    ? ''
                    : payload.rejection_reason ?? stored.rejection_reason ?? '',
              ...(payload.reviewed_by !== undefined ? { reviewed_by: payload.reviewed_by } : {}),
              reviewed_at: reviewsMap[id].reviewed_at,
            };
            localStorage.setItem('imtiyo_student_profile_v2', JSON.stringify(patched));
          }
        }
      } catch {
        /* ignore */
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('imtiyo_profile_updated'));
      }
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      const safePayload = { ...payload };
      delete safePayload.reviewed_by;
      delete safePayload.reviewed_at;
      const { data: retry1, error: err1 } = await supabase
        .from('profiles')
        .update(safePayload)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (!err1 && retry1) return mapProfile(retry1);

      // Second retry without optional columns (`course`, `password`, `email_verified`)
      delete safePayload.course;
      delete safePayload.password;
      delete safePayload.email_verified;
      const { data: retry2, error: err2 } = await supabase
        .from('profiles')
        .update(safePayload)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (!err2 && retry2) return mapProfile(retry2);

      // Final retry preserving core status + rejection_reason
      if ('status' in safePayload) {
        const minimal = {
          status: safePayload.status,
          ...('rejection_reason' in safePayload
            ? { rejection_reason: safePayload.rejection_reason }
            : {}),
        };
        const { data: retry3 } = await supabase
          .from('profiles')
          .update(minimal)
          .eq('id', id)
          .select()
          .maybeSingle();
        if (retry3) return mapProfile(retry3);
      }

      return null;
    }
    return updated ? mapProfile(updated) : null;
  },

  async setProfileStatus(id, status, rejection_reason = '', reviewed_by = '') {
    const session = this.getAdminSession();
    const reviewerName = reviewed_by || session?.name || 'Moderator';
    return this.saveProfile(id, {
      status,
      rejection_reason: status === 'verified' ? '' : rejection_reason,
      reviewed_by: reviewerName,
    });
  },

  // --- REDEMPTIONS ---
  async createRedemption(data) {
    const record = {
      id: 'red-' + Date.now(),
      student_name: data.student_name || 'Talaba',
      student_id: data.student_id || '',
      brand_id: data.brand_id,
      brand_name: data.brand_name || '',
      offer_id: data.offer_id || '',
      code: data.code || '',
      status: 'active',
      created_date: new Date().toISOString(),
    };
    const { data: inserted } = await supabase
      .from('redemptions')
      .insert(record)
      .select()
      .maybeSingle();
    return inserted || record;
  },

  async listRedemptions(studentName) {
    let query = supabase
      .from('redemptions')
      .select('*')
      .order('created_date', { ascending: false });
    if (studentName) query = query.eq('student_name', studentName);
    const { data, error } = await query;
    if (error || !data) return [];
    return data;
  },

  getLikedIds() {
    return readLocal(STORAGE_KEYS.LIKED_OFFERS, []).map(String);
  },

  isOfferLiked(offerId, likedList = null) {
    const clean = String(offerId || '').replace(/^offer:/, '');
    if (!clean) return false;
    const list = (likedList || this.getLikedIds()).map(String);
    return list.includes(`offer:${clean}`) || list.includes(clean);
  },

  toggleOfferLike(offerId) {
    const clean = String(offerId || '').replace(/^offer:/, '');
    if (!clean) return this.getLikedIds();
    const key = `offer:${clean}`;
    const current = readLocal(STORAGE_KEYS.LIKED_OFFERS, []).map(String);
    const exists = current.includes(key) || current.includes(clean);
    const next = exists
      ? current.filter((id) => id !== key && id !== clean)
      : [key, ...current.filter((id) => id !== key && id !== clean)];
    writeLocal(STORAGE_KEYS.LIKED_OFFERS, next);
    window.dispatchEvent(new Event('imtiyo_likes_changed'));
    return next;
  },

  isBrandLiked(brandId, likedList = null) {
    const clean = String(brandId || '').replace(/^brand[-:]/, '');
    if (!clean) return false;
    const list = (likedList || this.getLikedIds()).map(String);
    return list.includes(`brand:${clean}`) || list.includes(`brand-${clean}`);
  },

  toggleBrandLike(brandId) {
    const clean = String(brandId || '').replace(/^brand[-:]/, '');
    if (!clean) return this.getLikedIds();
    const key = `brand:${clean}`;
    const current = readLocal(STORAGE_KEYS.LIKED_OFFERS, []).map(String);
    const exists =
      current.includes(key) ||
      current.includes(`brand-${clean}`) ||
      current.includes(clean);
    const next = exists
      ? current.filter((id) => id !== key && id !== `brand-${clean}` && id !== clean)
      : [key, ...current];
    writeLocal(STORAGE_KEYS.LIKED_OFFERS, next);
    window.dispatchEvent(new Event('imtiyo_likes_changed'));
    return next;
  },

  toggleLike(itemId) {
    const strId = String(itemId);
    if (strId.startsWith('offer:')) {
      return this.toggleOfferLike(strId);
    }
    if (strId.startsWith('brand:') || strId.startsWith('brand-')) {
      return this.toggleBrandLike(strId);
    }
    const current = readLocal(STORAGE_KEYS.LIKED_OFFERS, []).map(String);
    const exists = current.includes(strId);
    const next = exists ? current.filter((id) => id !== strId) : [strId, ...current];
    writeLocal(STORAGE_KEYS.LIKED_OFFERS, next);
    window.dispatchEvent(new Event('imtiyo_likes_changed'));
    return next;
  },

  // --- UNIVERSITIES ---
  async listUniversities(force = false) {
    return cachedRequest(
      'universities',
      async () => {
        const { data, error } = await supabase
          .from('universities')
          .select('*')
          .order('name', { ascending: true });
        if (error || !data) return [];
        return [...data].sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || ''), 'uz')
        );
      },
      force
    );
  },

  async listUniversitiesAdmin() {
    return this.listUniversities(true);
  },

  async addUniversity(payload) {
    const isObj = typeof payload === 'object' && payload !== null;
    const cleanName = (isObj ? payload.name : payload || '').trim();
    if (!cleanName) return this.listUniversitiesAdmin();

    const record = {
      name: cleanName,
      ...(isObj && payload.region ? { region: payload.region } : {}),
      ...(isObj && payload.short_name ? { short_name: payload.short_name.trim() } : {}),
    };

    const { error } = await supabase
      .from('universities')
      .upsert(record, { onConflict: 'name' });
    if (error) {
      await supabase.from('universities').upsert({ name: cleanName }, { onConflict: 'name' });
    }
    invalidateCache('universities');
    return this.listUniversitiesAdmin();
  },

  async deleteUniversity(nameOrId) {
    const val = typeof nameOrId === 'object' ? nameOrId.name : nameOrId;
    await supabase.from('universities').delete().eq('name', val);
    invalidateCache('universities');
    return this.listUniversitiesAdmin();
  },

  // --- ADMIN AUTH ---
  isSuperAdmin(adminObj) {
    if (!adminObj) return false;
    return (
      adminObj.role === 'superadmin' ||
      String(adminObj.login || '').toLowerCase() === 'admin'
    );
  },

  getAdminPermissions(adminObj) {
    if (!adminObj) return [];
    if (this.isSuperAdmin(adminObj)) {
      return [
        'stats',
        'students',
        'deals',
        'categories',
        'universities',
        'messages',
        'notifications',
        'admins',
      ];
    }
    const permMap = readLocal(STORAGE_KEYS.ADMIN_PERMISSIONS, {});
    if (Array.isArray(adminObj.permissions) && adminObj.permissions.length > 0) {
      return adminObj.permissions;
    }
    if (Array.isArray(permMap[adminObj.login]) && permMap[adminObj.login].length > 0) {
      return permMap[adminObj.login];
    }
    return ['stats', 'students'];
  },

  getAdminSession() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        isSuper: this.isSuperAdmin(parsed),
        permissions: this.getAdminPermissions(parsed),
      };
    } catch {
      return null;
    }
  },

  async loginAdmin(login, password) {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .ilike('login', login.trim())
      .eq('password', password)
      .maybeSingle();
    if (error || !data) return null;
    const isSuper = this.isSuperAdmin(data);
    const permissions = this.getAdminPermissions(data);
    const session = {
      id: data.id,
      name: data.name,
      login: data.login,
      role: isSuper ? 'superadmin' : data.role || 'admin',
      isSuper,
      permissions,
    };
    sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
    return session;
  },

  logoutAdmin() {
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  },

  async listAdmins() {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    const permMap = readLocal(STORAGE_KEYS.ADMIN_PERMISSIONS, {});
    return data.map((a) => ({
      ...a,
      isSuper: this.isSuperAdmin(a),
      permissions: this.isSuperAdmin(a)
        ? [
            'stats',
            'students',
            'deals',
            'categories',
            'universities',
            'messages',
            'notifications',
            'admins',
          ]
        : a.permissions || permMap[a.login] || ['stats', 'students'],
    }));
  },

  async createAdmin({ name, login, password, permissions = ['stats', 'students'] }) {
    const currentSession = this.getAdminSession();
    if (!currentSession?.isSuper) {
      return { error: 'Faqat Super Admin yangi admin qo‘sha oladi!' };
    }

    const cleanLogin = login.trim();
    const { data: existing } = await supabase
      .from('admins')
      .select('id')
      .ilike('login', cleanLogin)
      .maybeSingle();
    if (existing) return { error: 'Bu login allaqachon mavjud' };

    const permMap = readLocal(STORAGE_KEYS.ADMIN_PERMISSIONS, {});
    permMap[cleanLogin] = permissions;
    writeLocal(STORAGE_KEYS.ADMIN_PERMISSIONS, permMap);

    const created = {
      id: 'adm-' + Date.now(),
      name: name.trim(),
      login: cleanLogin,
      password,
      role: 'admin',
    };
    const { data: inserted, error } = await supabase
      .from('admins')
      .insert(created)
      .select()
      .single();
    if (error) return { error: 'Admin yaratishda xatolik yuz berdi' };
    return { admin: { ...inserted, permissions } };
  },

  async updateAdminPermissions(adminLogin, permissions) {
    const currentSession = this.getAdminSession();
    if (!currentSession?.isSuper) return false;
    if (String(adminLogin).toLowerCase() === 'admin') return false;

    const permMap = readLocal(STORAGE_KEYS.ADMIN_PERMISSIONS, {});
    permMap[adminLogin] = permissions;
    writeLocal(STORAGE_KEYS.ADMIN_PERMISSIONS, permMap);
    return true;
  },

  async deleteAdmin(id) {
    const currentSession = this.getAdminSession();
    if (!currentSession?.isSuper) return false;

    const all = await this.listAdmins();
    const target = all.find((a) => a.id === id);
    if (!target || this.isSuperAdmin(target)) return false;
    await supabase.from('admins').delete().eq('id', id);
    return true;
  },

  // --- SUPPORT / HELP MESSAGES (Talabalar yordam & shikoyatlari -> Admin) ---
  async listSupportMessages() {
    const localList = readLocal(STORAGE_KEYS.SUPPORT_MESSAGES, []);
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        const mergedMap = new Map();
        data.forEach((m) => mergedMap.set(m.id, m));
        (Array.isArray(localList) ? localList : []).forEach((m) => {
          if (m?.id && !mergedMap.has(m.id)) mergedMap.set(m.id, m);
        });
        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        writeLocal(STORAGE_KEYS.SUPPORT_MESSAGES, merged);
        return merged;
      }
    } catch {
      /* fallback */
    }
    return Array.isArray(localList) ? localList : [];
  },

  async createSupportMessage(payload = {}) {
    const now = new Date().toISOString();
    const record = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      student_id: payload.student_id || '',
      full_name: String(payload.full_name || '').trim() || 'Foydalanuvchi',
      contact: String(payload.contact || '').trim(),
      email: String(payload.email || '').trim(),
      category: payload.category || 'help', // 'help' | 'complaint' | 'suggestion' | 'question'
      message: String(payload.message || '').trim(),
      status: 'new', // 'new' | 'read' | 'replied'
      admin_note: '',
      created_at: now,
      updated_at: now,
    };

    const current = readLocal(STORAGE_KEYS.SUPPORT_MESSAGES, []);
    writeLocal(STORAGE_KEYS.SUPPORT_MESSAGES, [
      record,
      ...(Array.isArray(current) ? current : []),
    ]);

    try {
      await supabase.from('support_messages').insert(record);
    } catch {
      /* fallback kept in localStorage */
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('imtiyo_messages_changed'));
    }
    return record;
  },

  async updateSupportMessage(id, changes = {}) {
    const now = new Date().toISOString();
    const patch = {
      ...(changes.status !== undefined ? { status: changes.status } : {}),
      ...(changes.admin_note !== undefined ? { admin_note: changes.admin_note } : {}),
      updated_at: now,
    };

    const current = readLocal(STORAGE_KEYS.SUPPORT_MESSAGES, []);
    const next = (Array.isArray(current) ? current : []).map((m) =>
      m.id === id ? { ...m, ...patch } : m
    );
    writeLocal(STORAGE_KEYS.SUPPORT_MESSAGES, next);

    try {
      await supabase.from('support_messages').update(patch).eq('id', id);
    } catch {
      /* ignore */
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('imtiyo_messages_changed'));
    }
    return next.find((m) => m.id === id) || null;
  },

  async deleteSupportMessage(id) {
    const current = readLocal(STORAGE_KEYS.SUPPORT_MESSAGES, []);
    const next = (Array.isArray(current) ? current : []).filter((m) => m.id !== id);
    writeLocal(STORAGE_KEYS.SUPPORT_MESSAGES, next);

    try {
      await supabase.from('support_messages').delete().eq('id', id);
    } catch {
      /* ignore */
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('imtiyo_messages_changed'));
    }
    return true;
  },

  // --- ADMIN BROADCAST & DIRECT USER NOTIFICATIONS (registered | guest | all | user) ---
  normalizeBroadcastNotification(n) {
    if (!n || typeof n !== 'object') return null;
    const rawAud = String(n.audience || 'all');
    if (rawAud.startsWith('user:')) {
      // Fallback format: user:<student_id>|<profile_id>|<name> (when DB target_* columns not yet added)
      const rest = rawAud.slice(5);
      const [sid = '', pid = '', tName = ''] = rest.split('|');
      return {
        ...n,
        audience: 'user',
        target_student_id: n.target_student_id || sid,
        target_profile_id: n.target_profile_id || pid,
        target_name: n.target_name || tName,
      };
    }
    return {
      ...n,
      audience: ['registered', 'guest', 'all', 'user'].includes(rawAud) ? rawAud : 'all',
      target_student_id: n.target_student_id || '',
      target_profile_id: n.target_profile_id || '',
      target_name: n.target_name || '',
    };
  },

  async listBroadcastNotifications() {
    const localList = readLocal(STORAGE_KEYS.BROADCAST_NOTIFICATIONS, []).map((n) =>
      this.normalizeBroadcastNotification(n)
    ).filter(Boolean);
    try {
      const { data, error } = await supabase
        .from('broadcast_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        const mergedMap = new Map();
        data.forEach((raw) => {
          const n = this.normalizeBroadcastNotification(raw);
          if (n?.id) mergedMap.set(n.id, n);
        });
        localList.forEach((n) => {
          if (n?.id && !mergedMap.has(n.id)) mergedMap.set(n.id, n);
        });
        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        writeLocal(STORAGE_KEYS.BROADCAST_NOTIFICATIONS, merged);
        return merged;
      }
    } catch {
      /* fallback */
    }
    return localList;
  },

  async createBroadcastNotification({
    title,
    message,
    audience = 'all',
    tone = 'info',
    target_student_id = '',
    target_profile_id = '',
    target_name = '',
  }) {
    const session = this.getAdminSession();
    const cleanAudience = ['registered', 'guest', 'all', 'user'].includes(audience)
      ? audience
      : 'all';
    const record = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      title: String(title || '').trim(),
      message: String(message || '').trim(),
      audience: cleanAudience,
      tone: ['info', 'promo', 'alert'].includes(tone) ? tone : 'info',
      target_student_id: cleanAudience === 'user' ? String(target_student_id || '').trim() : '',
      target_profile_id: cleanAudience === 'user' ? String(target_profile_id || '').trim() : '',
      target_name: cleanAudience === 'user' ? String(target_name || '').trim() : '',
      sent_by: session?.name || 'Admin',
      created_at: new Date().toISOString(),
    };

    const current = readLocal(STORAGE_KEYS.BROADCAST_NOTIFICATIONS, []);
    writeLocal(STORAGE_KEYS.BROADCAST_NOTIFICATIONS, [
      record,
      ...(Array.isArray(current) ? current : []),
    ]);

    try {
      const { error } = await supabase.from('broadcast_notifications').insert(record);
      if (error && cleanAudience === 'user') {
        // Fallback if target_* columns have not been added in Supabase yet: encode in `audience` text column
        const compactPayload = {
          id: record.id,
          title: record.title,
          message: record.message,
          audience: `user:${record.target_student_id}|${record.target_profile_id}|${record.target_name}`,
          tone: record.tone,
          sent_by: record.sent_by,
          created_at: record.created_at,
        };
        await supabase.from('broadcast_notifications').insert(compactPayload);
      }
    } catch {
      /* fallback kept in localStorage */
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('imtiyo_notifications_changed'));
    }
    return record;
  },

  async deleteBroadcastNotification(id) {
    const current = readLocal(STORAGE_KEYS.BROADCAST_NOTIFICATIONS, []);
    const next = (Array.isArray(current) ? current : []).filter((n) => n.id !== id);
    writeLocal(STORAGE_KEYS.BROADCAST_NOTIFICATIONS, next);

    try {
      await supabase.from('broadcast_notifications').delete().eq('id', id);
    } catch {
      /* ignore */
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('imtiyo_notifications_changed'));
    }
    return true;
  },
};

export default api;