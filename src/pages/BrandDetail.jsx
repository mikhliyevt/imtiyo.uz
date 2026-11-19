import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  Copy,
  ExternalLink,
  Facebook,
  Heart,
  Home as HomeIcon,
  Instagram,
  Linkedin,
  MapPin,
  Music2,
  Navigation,
  QrCode,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import AppShell, { openAuthPromptModal } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { useStudent } from '@/lib/StudentContext';
import { useToast } from '@/components/ui/use-toast';
import { api, DEFAULT_CATEGORIES } from '@/services/api';
import { copyText } from '@/lib/deal';
import { cn } from '@/lib/utils';

export default function BrandDetail() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { profile } = useStudent();
  const { toast } = useToast();

  const [brand, setBrand] = useState(null);
  const [offers, setOffers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [likedIds, setLikedIds] = useState(() => api.getLikedIds().map(String));

  // Tanlangan chegirma (2-rasmdagidek Activate Offer + Terms + View on map sahifasi)
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [activeBranch, setActiveBranch] = useState(null);
  const [activatedCode, setActivatedCode] = useState(null);

  useEffect(() => {
    if (!slug) return;
    setSelectedOffer(null);
    setActivatedCode(null);
    Promise.all([
      api.getBrand(slug),
      api.listOffers(slug),
      api.listLocations(slug),
      api.listCategories(),
    ]).then(([bData, oList, locList, cList]) => {
      setBrand(bData);
      setOffers(Array.isArray(oList) ? oList : []);
      const validLocs = Array.isArray(locList) ? locList : [];
      setLocations(validLocs);
      if (validLocs.length > 0) setActiveBranch(validLocs[0]);
      if (Array.isArray(cList) && cList.length) setCategories(cList);
    });
  }, [slug]);

  useEffect(() => {
    const sync = () => setLikedIds(api.getLikedIds().map(String));
    window.addEventListener('imtiyo_likes_changed', sync);
    return () => window.removeEventListener('imtiyo_likes_changed', sync);
  }, []);

  const categoryObj = useMemo(() => {
    const fromQuery = searchParams.get('cat');
    const catId =
      fromQuery && fromQuery !== 'all' ? fromQuery : brand?.category || 'food';
    return (
      categories.find((c) => c.id === catId) || {
        id: catId,
        label_uz: 'Taomlar va ichimliklar',
      }
    );
  }, [categories, brand, searchParams]);

  if (!brand) {
    return (
      <AppShell>
        <div className="py-16 text-center text-[13.5px] font-bold text-slate-400">
          Yuklanmoqda...
        </div>
      </AppShell>
    );
  }

  const isBrandLiked = likedIds.includes(String(brand.id));
  const showBrandMap = Boolean(brand.has_map) && locations.length > 0;

  const handleLikeClick = (targetId) => {
    if (!profile?.signedIn) {
      openAuthPromptModal('like');
      return;
    }
    api.toggleLike(targetId);
  };

  const handleActivateOffer = async (offerItem) => {
    if (!profile?.signedIn || profile?.status !== 'verified') {
      openAuthPromptModal('deal');
      return;
    }

    const generatedCode =
      offerItem?.promoCode ||
      `${brand.promoPrefix || 'IMTIYO'}-${Math.floor(1000 + Math.random() * 9000)}`;

    await api.createRedemption({
      student_name: profile.name,
      student_id: profile.student_id,
      brand_id: brand.id,
      brand_name: brand.name,
      offer_id: offerItem?.id || '',
      code: generatedCode,
    });

    setActivatedCode({
      title: offerItem?.title_uz || offerItem?.title?.uz || brand.name,
      code: generatedCode,
      redemption: offerItem?.redemption || 'qr',
    });
  };

  const displayOffers =
    offers.length > 0
      ? offers
      : [
          {
            id: `default-${brand.id}`,
            title_uz: brand.tagline?.uz || `${brand.name} talaba chegirmasi`,
            description_uz:
              brand.description?.uz ||
              `${brand.name} barcha filiallari va xizmatlarida tasdiqlangan talabalar uchun maxsus chegirma.`,
            terms_uz:
              '1. Chegirma faqat tasdiqlangan IMTIYO talabalari uchun amal qiladi.\n2. Kod faollashtirilgandan so‘ng 15 daqiqa davomida kassada ko‘rsatilishi lozim.',
            discount: brand.discount || 'Maxsus taklif',
            redemption: brand.redemption || 'qr',
            valid_until: brand.valid_until || '31/12/2026',
            image_url: brand.cover_url,
          },
        ];

  return (
    <AppShell>
      <div className="space-y-8 pb-8">
        {/* BREADCRUMB: Home > Category > Brand (> Offer) */}
        <nav className="flex flex-wrap items-center gap-2 text-[12.5px] font-bold text-slate-500">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-[#002D96]"
          >
            <HomeIcon className="h-3.5 w-3.5" />
            <span>Asosiy</span>
          </Link>
          <span className="text-slate-300">›</span>
          <Link
            to={`/?cat=${categoryObj.id}`}
            className="text-slate-600 transition-colors hover:text-[#002D96]"
          >
            {categoryObj.label_uz}
          </Link>
          <span className="text-slate-300">›</span>
          {selectedOffer ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setSelectedOffer(null);
                  setActivatedCode(null);
                }}
                className="text-slate-600 hover:text-[#002D96]"
              >
                {brand.name}
              </button>
              <span className="text-slate-300">›</span>
              <span className="font-extrabold text-[#5B21B6]">
                {selectedOffer.title_uz || selectedOffer.title?.uz}
              </span>
            </>
          ) : (
            <span className="font-extrabold text-[#5B21B6]">{brand.name}</span>
          )}
        </nav>

        {/* =========================================================
            AGAR CHEGIRMA TANLANGAN BO'LSA -> 2-RASMDAGIDEK CHEGIRMA DETAL OYNA (ACTIVATE OFFER + TERMS + VIEW ON MAP)
        ========================================================= */}
        {selectedOffer ? (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => {
                setSelectedOffer(null);
                setActivatedCode(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[12px] font-extrabold text-[#08123A] shadow-2xs hover:border-[#5B21B6]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{brand.name} sahifasiga qaytish</span>
            </button>

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
              {/* Chapda chegirma rasmi (2-rasmdagidek) */}
              <div className="lg:col-span-5">
                <div className="overflow-hidden rounded-[26px] border border-slate-200/70 bg-white shadow-md">
                  <img
                    src={selectedOffer.image_url || brand.cover_url}
                    alt={selectedOffer.title_uz || brand.name}
                    className="aspect-[16/11] w-full object-cover"
                  />
                </div>
              </div>

              {/* O'ngda: Muddati, Tavsif, "Activate offer", "Terms" va "View on map" (2-rasmdagidek) */}
              <div className="space-y-5 lg:col-span-7">
                <div>
                  <div className="flex items-center gap-3">
                    {brand.logo_url && (
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                        className="h-10 w-10 rounded-xl border border-slate-100 bg-white object-contain p-1 shadow-2xs"
                      />
                    )}
                    <span className="text-[14px] font-extrabold text-slate-500">
                      {brand.name}
                    </span>
                  </div>

                  <h1 className="mt-2 text-[26px] font-black leading-tight text-[#08123A] md:text-[32px]">
                    {selectedOffer.title_uz || selectedOffer.title?.uz}
                  </h1>

                  <p className="mt-2 text-[13px] font-semibold text-slate-500">
                    Amal qiladi: {selectedOffer.valid_until || '31/12/2026'} gacha •{' '}
                    {selectedOffer.redemption === 'app' ? 'Online' : 'Filialda (On-site)'}
                  </p>

                  <p className="mt-4 text-[14.5px] leading-relaxed font-medium text-slate-700">
                    {selectedOffer.description_uz ||
                      brand.description?.uz ||
                      `${selectedOffer.title_uz} — faqat tasdiqlangan talabalar uchun amal qiladi.`}
                  </p>
                </div>

                {/* ACTIVATE OFFER TUGMASI YOKI OCHILGAN KOD */}
                {!activatedCode ? (
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => handleActivateOffer(selectedOffer)}
                      className="flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#5B21B6] via-[#6D28D9] to-[#4C1D95] px-8 text-[14.5px] font-extrabold text-white shadow-[0_14px_30px_-10px_rgba(91,33,182,0.7)] transition-transform hover:scale-[1.01]"
                    >
                      Chegirmani faollashtirish (Activate offer)
                    </button>
                    <p className="text-center text-[12px] font-medium text-slate-500">
                      Faollashtirilgandan so‘ng{' '}
                      <strong className="font-extrabold text-[#5B21B6]">15 daqiqa ichida</strong>{' '}
                      chegirmadan foydalaning.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[24px] border-2 border-[#5B21B6]/30 bg-[#EDE9FE]/50 p-5 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-[11.5px] font-extrabold text-emerald-700">
                      <ShieldCheck className="h-4 w-4" />
                      Chegirma faollashtirildi (15 daqiqa faol)
                    </span>
                    <p className="mt-3 font-mono text-[26px] font-black tracking-widest text-[#08123A]">
                      {activatedCode.code}
                    </p>
                    <div className="mt-3 flex justify-center">
                      <Button
                        type="button"
                        onClick={async () => {
                          await copyText(activatedCode.code);
                          toast({ title: 'Kod nusxalandi!', description: activatedCode.code });
                        }}
                        className="h-10 rounded-full bg-[#5B21B6] px-6 text-[12.5px] font-extrabold text-white"
                      >
                        <Copy className="mr-2 h-3.5 w-3.5" />
                        Kodni nusxalash
                      </Button>
                    </div>
                  </div>
                )}

                {/* TERMS (FOYDALANISH SHARTLARI ACCORDION — 2-RASM) */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white">
                  <button
                    type="button"
                    onClick={() => setTermsOpen((v) => !v)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left text-[14.5px] font-extrabold text-[#08123A] hover:bg-slate-50/60"
                  >
                    <span>Shartlar (Terms)</span>
                    <ChevronDown
                      className={cn(
                        'h-4.5 w-4.5 text-slate-500 transition-transform duration-200',
                        termsOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  {termsOpen && (
                    <div className="border-t border-slate-100 px-5 pb-4 pt-3 text-[13px] whitespace-pre-line leading-relaxed text-slate-600">
                      {selectedOffer.terms_uz}
                    </div>
                  )}
                </div>

                {/* VIEW ON MAP (FAQAT ADMIN XARITA QO'SHGAN BO'LSAGINA CHIQADI — 2-RASM) */}
                {showBrandMap && (
                  <div className="relative h-44 w-full overflow-hidden rounded-[24px] border border-slate-200/90 bg-slate-100 shadow-xs">
                    <iframe
                      title="Offer Map Preview"
                      src={`https://maps.google.com/maps?q=${
                        locations[0]?.lat || 41.311081
                      },${locations[0]?.lng || 69.240562}&z=14&output=embed`}
                      className="pointer-events-none h-full w-full border-0 opacity-85"
                      loading="lazy"
                    />
                    <div className=" absolute inset-0 flex items-center justify-center bg-white/15 backdrop-blur-[1px]">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveBranch(locations[0]);
                          setMapModalOpen(true);
                        }}
                        className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-[13px] font-extrabold text-[#08123A] shadow-lg transition-transform hover:scale-105"
                      >
                        Xaritada ko‘rish (View on map)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================
              BREND ASOSIY SAHIFASI VA CHEGIRMALAR RO'YXATI
          ========================================================= */
          <>
            <section className="relative grid grid-cols-1 items-start gap-7 rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_18px_45px_-28px_rgba(8,18,58,0.2)] md:grid-cols-12 md:p-8">
              <button
                type="button"
                onClick={() => handleLikeClick(brand.id)}
                aria-label="Saqlash"
                className="absolute right-6 top-6 z-10 grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-[#08123A] shadow-xs transition-transform hover:scale-105"
              >
                <Heart
                  className={cn(
                    'h-5 w-5',
                    isBrandLiked
                      ? 'fill-[#08123A] text-[#08123A]'
                      : 'fill-transparent text-[#08123A]'
                  )}
                />
              </button>

              <div className="overflow-hidden rounded-[22px] md:col-span-5">
                <div
                  className="aspect-[16/11] w-full overflow-hidden rounded-[22px]"
                  style={{
                    background: `linear-gradient(135deg, ${brand.accent || '#002D96'}, ${
                      brand.accent2 || '#1D6FF2'
                    })`,
                  }}
                >
                  {brand.cover_url && (
                    <img
                      src={brand.cover_url}
                      alt={brand.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-between space-y-4 pr-8 md:col-span-7">
                <div className="flex items-center gap-4">
                  <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[20px] border border-slate-100 bg-white p-2.5 shadow-[0_10px_28px_-12px_rgba(8,18,58,0.18)]">
                    {brand.logo_url ? (
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span
                        className="text-[24px] font-black"
                        style={{ color: brand.accent || '#002D96' }}
                      >
                        {brand.monogram}
                      </span>
                    )}
                  </div>
                  <h1 className="text-[28px] font-black tracking-tight text-[#08123A] md:text-[34px]">
                    {brand.name}
                  </h1>
                </div>

                <p className="text-[14px] leading-relaxed font-medium text-slate-600">
                  {brand.description?.uz}
                </p>

                {/* FAQAT ADMIN KIRITGAN SOCIAL MEDIALAR VA VEB-SAYT CHIQADI */}
                {(brand.facebook ||
                  brand.instagram ||
                  brand.linkedin ||
                  brand.tiktok ||
                  brand.website) && (
                  <div className="flex flex-wrap items-center gap-2.5 pt-2">
                    {brand.facebook && (
                      <a
                        href={brand.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-[#08123A] hover:text-[#08123A]"
                        aria-label="Facebook"
                      >
                        <Facebook className="h-4 w-4" />
                      </a>
                    )}
                    {brand.instagram && (
                      <a
                        href={brand.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-[#08123A] hover:text-[#08123A]"
                        aria-label="Instagram"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                    {brand.linkedin && (
                      <a
                        href={brand.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-[#08123A] hover:text-[#08123A]"
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {brand.tiktok && (
                      <a
                        href={brand.tiktok}
                        target="_blank"
                        rel="noreferrer"
                        className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-[#08123A] hover:text-[#08123A]"
                        aria-label="TikTok"
                      >
                        <Music2 className="h-4 w-4" />
                      </a>
                    )}
                    {brand.website && (
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-[12.5px] font-bold text-[#08123A] transition-colors hover:border-[#08123A]"
                      >
                        <span>Veb-saytga o‘tish</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* JORIY TALABA CHEGIRMALARI */}
            <section className="space-y-4">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[20px] font-extrabold text-[#08123A]">
                  {brand.name}: Joriy talaba chegirmalari
                </h2>
                <span className="rounded-full bg-[#EDE9FE] px-3 py-0.5 text-[12px] font-extrabold text-[#5B21B6]">
                  {displayOffers.length}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {displayOffers.map((offer) => {
                  const offerImg = offer.image_url || brand.cover_url;
                  return (
                    <div
                      key={offer.id}
                      onClick={() => {
                        setSelectedOffer(offer);
                        setActivatedCode(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="group flex cursor-pointer flex-col overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_14px_34px_-20px_rgba(8,18,58,0.18)] transition-all hover:-translate-y-0.5 hover:shadow-md sm:flex-row"
                    >
                      <div
                        className="relative h-48 w-full shrink-0 overflow-hidden sm:h-auto sm:w-48"
                        style={{
                          background: `linear-gradient(135deg, ${brand.accent || '#002D96'}, ${
                            brand.accent2 || '#1D6FF2'
                          })`,
                        }}
                      >
                        {offerImg && (
                          <img
                            src={offerImg}
                            alt={offer.title_uz || brand.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white via-white/75 to-transparent backdrop-blur-[2px]" />

                        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-extrabold text-pink-600 shadow-xs">
                          <Sparkles className="h-3 w-3" />
                          Yangi
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div>
                          <h3 className="text-[17px] font-extrabold text-[#08123A] group-hover:text-[#5B21B6]">
                            {offer.title_uz || offer.title?.uz || `${brand.name} talaba chegirmasi`}
                          </h3>
                          <p className="mt-1.5 text-[12.5px] font-medium text-slate-500">
                            Amal qiladi: {offer.valid_until || '31/12/2026'} gacha •{' '}
                            {offer.redemption === 'app' ? 'Online' : 'Filialda (On-site)'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOffer(offer);
                            setActivatedCode(null);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="mt-5 flex h-11 w-full items-center justify-center rounded-full bg-[#EDE9FE] px-6 text-[13px] font-extrabold text-[#4C1D95] transition-colors hover:bg-[#DDD6FE]"
                        >
                          Chegirmani olish (Claim discount)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>

      {/* XARITADA KO'RISH MODALI ("View on map" bosilganda ochiladi) */}
      {mapModalOpen && showBrandMap && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#08123A]/60 p-4 backdrop-blur-xs"
          onClick={() => setMapModalOpen(false)}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-[16px] font-extrabold text-[#08123A]">
                  {brand.name} — Xaritadagi filiallar ({locations.length})
                </h3>
                <p className="text-[12px] text-slate-500">
                  {activeBranch?.address || 'Toshkent shahri'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMapModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="h-80 w-full bg-slate-100">
              <iframe
                key={`${activeBranch?.lat}-${activeBranch?.lng}`}
                title="Brand Map Full"
                src={`https://maps.google.com/maps?q=${activeBranch?.lat || 41.311081},${
                  activeBranch?.lng || 69.240562
                }&z=15&output=embed`}
                className="h-full w-full border-0"
                loading="lazy"
              />
            </div>

            <div className="max-h-52 space-y-2 overflow-y-auto p-4">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  onClick={() => setActiveBranch(loc)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-3 transition-colors',
                    activeBranch?.id === loc.id
                      ? 'border-[#5B21B6] bg-[#EDE9FE]/40'
                      : 'border-slate-100 bg-slate-50 hover:bg-white'
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-extrabold text-[#08123A]">
                      {loc.name}
                    </p>
                    <p className="truncate text-[11.5px] text-slate-500">{loc.address}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#002D96] px-3.5 py-1.5 text-[11.5px] font-bold text-white"
                  >
                    <Navigation className="h-3 w-3" />
                    Google Maps’da borish
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}