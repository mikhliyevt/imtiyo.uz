import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  ChevronDown,
  Copy,
  ExternalLink,
  Facebook,
  Heart,
  Instagram,
  Linkedin,
  Music2,
  Navigation,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import AppShell, { openAuthPromptModal } from '@/components/AppShell';
import CardImageBlur from '@/components/CardImageBlur';
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

  const [selectedOffer, setSelectedOffer] = useState(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [activeBranch, setActiveBranch] = useState(null);
  const [activatedCode, setActivatedCode] = useState(null);

  const requestedOfferId = searchParams.get('offer') || '';

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setSelectedOffer(null);
    setActivatedCode(null);
    Promise.all([
      api.getBrand(slug),
      api.listOffers(slug),
      api.listLocations(slug),
      api.listCategories(),
    ]).then(([bData, oList, locList, cList]) => {
      if (!active) return;
      setBrand(bData);
      const validOffers = Array.isArray(oList) ? oList : [];
      setOffers(validOffers);
      const validLocs = Array.isArray(locList) ? locList : [];
      setLocations(validLocs);
      if (validLocs.length > 0) setActiveBranch(validLocs[0]);
      if (Array.isArray(cList) && cList.length) setCategories(cList);

      if (requestedOfferId && bData) {
        const cleanReq = requestedOfferId.replace(/^offer:/, '');
        const match = validOffers.find((o) => String(o.id) === cleanReq);
        if (match) {
          setSelectedOffer(match);
        } else if (cleanReq === `default-${bData.id}` && validOffers.length === 0) {
          setSelectedOffer({
            id: `default-${bData.id}`,
            title_uz: bData.tagline?.uz || `${bData.name} talaba chegirmasi`,
            description_uz:
              bData.description?.uz ||
              `${bData.name} barcha filiallari va xizmatlarida tasdiqlangan talabalar uchun maxsus chegirma.`,
            terms_uz:
              '1. Chegirma faqat tasdiqlangan IMTIYO talabalari uchun amal qiladi.\n2. Kod faollashtirilgandan so‘ng 15 daqiqa davomida kassada ko‘rsatilishi lozim.',
            discount: bData.discount || 'Maxsus taklif',
            redemption: bData.redemption || 'qr',
            valid_until: bData.valid_until || '31/12/2026',
            image_url: bData.cover_url,
          });
        }
      }
    });
    return () => {
      active = false;
    };
  }, [slug, requestedOfferId]);

  useEffect(() => {
    const sync = () => setLikedIds(api.getLikedIds().map(String));
    window.addEventListener('imtiyo_likes_changed', sync);
    return () => window.removeEventListener('imtiyo_likes_changed', sync);
  }, []);

  const categoryObj = useMemo(() => {
    const fromQuery = searchParams.get('cat');
    const catId = fromQuery && fromQuery !== 'all' ? fromQuery : brand?.category || 'food';
    return (
      categories.find((c) => c.id === catId) || {
        id: catId,
        label_uz: 'Taomlar va ichimliklar',
      }
    );
  }, [categories, brand, searchParams]);

  const breadcrumbs = useMemo(() => {
    if (!brand) return [{ label: 'Yuklanmoqda...' }];
    const base = [{ label: categoryObj.label_uz, to: `/?cat=${categoryObj.id}` }];
    if (selectedOffer) {
      return [
        ...base,
        {
          label: brand.name,
          onClick: () => {
            setSelectedOffer(null);
            setActivatedCode(null);
          },
        },
        { label: selectedOffer.title_uz || selectedOffer.title?.uz || 'Chegirma' },
      ];
    }
    return [...base, { label: brand.name }];
  }, [brand, categoryObj, selectedOffer]);

  if (!brand) {
    return (
      <AppShell breadcrumbs={breadcrumbs}>
        <div className="space-y-6 pb-8">
          <div className="grid grid-cols-1 gap-7 rounded-[28px] border border-slate-200/70 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-12 md:p-8">
            <div className="aspect-[16/11] animate-pulse rounded-[22px] bg-slate-200/80 dark:bg-slate-800 md:col-span-5" />
            <div className="space-y-4 md:col-span-7">
              <div className="h-16 w-64 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800" />
              <div className="h-4 w-full animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-800" />
              <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-800" />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const isBrandLiked = api.isBrandLiked(brand.id, likedIds);
  const showBrandMap = Boolean(brand.has_map) && locations.length > 0;

  const handleBrandLikeClick = () => {
    if (!profile?.signedIn) {
      openAuthPromptModal('like');
      return;
    }
    api.toggleBrandLike(brand.id);
  };

  const handleOfferLikeClick = (e, offerId) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!profile?.signedIn) {
      openAuthPromptModal('like');
      return;
    }
    api.toggleOfferLike(offerId);
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
    <AppShell breadcrumbs={breadcrumbs}>
      <div className="space-y-8 pb-8">
        {selectedOffer ? (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
                <img
                  src={selectedOffer.image_url || brand.cover_url}
                  alt={selectedOffer.title_uz || brand.name}
                  className="aspect-[16/11] w-full object-cover"
                />
              </div>
            </div>

            <div className="space-y-5 lg:col-span-7">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {brand.logo_url && (
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                        className="h-10 w-10 rounded-xl border border-slate-100 bg-white object-contain p-1 shadow-sm"
                      />
                    )}
                    <span className="text-[14px] font-extrabold text-slate-500 dark:text-slate-400">
                      {brand.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleOfferLikeClick(e, selectedOffer.id)}
                    aria-label="Chegirmani saqlash"
                    className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-[12px] font-bold text-[#08123A] shadow-sm transition-transform hover:scale-105 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <Heart
                      className={cn(
                        'h-4 w-4 transition-colors',
                        api.isOfferLiked(selectedOffer.id, likedIds)
                          ? 'fill-rose-500 text-rose-500'
                          : 'fill-transparent text-[#08123A] dark:text-slate-200'
                      )}
                    />
                    <span>
                      {api.isOfferLiked(selectedOffer.id, likedIds) ? 'Saqlangan' : 'Saqlash'}
                    </span>
                  </button>
                </div>

                <h1 className="mt-2 text-[26px] font-black leading-tight text-[#08123A] dark:text-white md:text-[32px]">
                  {selectedOffer.title_uz || selectedOffer.title?.uz}
                </h1>

                <p className="mt-2 text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                  Amal qiladi: {selectedOffer.valid_until || '31/12/2026'} gacha •{' '}
                  {selectedOffer.redemption === 'app' ? 'Online' : 'Filialda (On-site)'}
                </p>

                <p className="mt-4 text-[14.5px] leading-relaxed font-medium text-slate-700 dark:text-slate-300">
                  {selectedOffer.description_uz ||
                    brand.description?.uz ||
                    `${selectedOffer.title_uz} — faqat tasdiqlangan talabalar uchun amal qiladi.`}
                </p>
              </div>

              {!activatedCode ? (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => handleActivateOffer(selectedOffer)}
                    className="flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#002D96] via-[#1D6FF2] to-[#00A9FF] px-8 text-[14.5px] font-extrabold text-white shadow-[0_14px_30px_-10px_rgba(0,45,150,0.75)] transition-transform hover:scale-[1.01]"
                  >
                    Chegirmani faollashtirish (Activate offer)
                  </button>
                  <p className="text-center text-[12px] font-medium text-slate-500 dark:text-slate-400">
                    Faollashtirilgandan so‘ng{' '}
                    <strong className="font-extrabold text-[#1D6FF2] dark:text-sky-400">
                      15 daqiqa ichida
                    </strong>{' '}
                    chegirmadan foydalaning.
                  </p>
                </div>
              ) : (
                <div className="rounded-[24px] border-2 border-[#1D6FF2]/30 bg-[#1D6FF2]/[0.06] p-5 text-center dark:border-sky-500/30 dark:bg-sky-500/10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-[11.5px] font-extrabold text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck className="h-4 w-4" />
                    Chegirma faollashtirildi (15 daqiqa faol)
                  </span>
                  <p className="mt-3 font-mono text-[26px] font-black tracking-widest text-[#08123A] dark:text-white">
                    {activatedCode.code}
                  </p>
                  <div className="mt-3 flex justify-center">
                    <Button
                      type="button"
                      onClick={async () => {
                        await copyText(activatedCode.code);
                        toast({ title: 'Kod nusxalandi!', description: activatedCode.code });
                      }}
                      className="h-10 rounded-full bg-[#002D96] px-6 text-[12.5px] font-extrabold text-white hover:bg-[#1D6FF2]"
                    >
                      <Copy className="mr-2 h-3.5 w-3.5" />
                      Kodni nusxalash
                    </Button>
                  </div>
                </div>
              )}

              {/* TERMS ACCORDION */}
              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setTermsOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-[14.5px] font-extrabold text-[#08123A] hover:bg-slate-50/70 dark:text-white dark:hover:bg-slate-800/70"
                >
                  <span>Shartlar (Terms)</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-slate-500 transition-transform duration-200 dark:text-slate-400',
                      termsOpen && 'rotate-180'
                    )}
                  />
                </button>
                {termsOpen && (
                  <div className="border-t border-slate-100 px-5 pb-4 pt-3 text-[13px] whitespace-pre-line leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">
                    {selectedOffer.terms_uz}
                  </div>
                )}
              </div>

              {showBrandMap && (
                <div className="relative h-44 w-full overflow-hidden rounded-[24px] border border-slate-200/90 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <iframe
                    title="Offer Map Preview"
                    src={`https://maps.google.com/maps?q=${
                      locations[0]?.lat || 41.311081
                    },${locations[0]?.lng || 69.240562}&z=14&output=embed`}
                    className="pointer-events-none h-full w-full border-0 opacity-85"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-white/15 backdrop-blur-[1px] dark:bg-slate-950/35">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveBranch(locations[0]);
                        setMapModalOpen(true);
                      }}
                      className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-[13px] font-extrabold text-[#08123A] shadow-lg transition-transform hover:scale-105 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      Xaritada ko‘rish (View on map)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <section className="relative grid grid-cols-1 items-start gap-7 rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_45px_-28px_rgba(8,18,58,0.18)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 md:grid-cols-12 md:p-8">
              <button
                type="button"
                onClick={handleBrandLikeClick}
                aria-label="Brendni saqlash"
                title="Brendni saqlash"
                className="absolute right-6 top-6 z-10 grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-[#08123A] shadow-sm transition-transform hover:scale-105 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <Heart
                  className={cn(
                    'h-5 w-5',
                    isBrandLiked
                      ? 'fill-rose-500 text-rose-500'
                      : 'fill-transparent text-[#08123A] dark:text-slate-200'
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
                  <h1 className="text-[28px] font-black tracking-tight text-[#08123A] dark:text-white md:text-[34px]">
                    {brand.name}
                  </h1>
                </div>

                <p className="text-[14px] leading-relaxed font-medium text-slate-600 dark:text-slate-300">
                  {brand.description?.uz}
                </p>

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
                        rel="noopener noreferrer"
                        className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-[#1D6FF2] hover:text-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        aria-label="Facebook"
                      >
                        <Facebook className="h-4 w-4" />
                      </a>
                    )}
                    {brand.instagram && (
                      <a
                        href={brand.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-[#1D6FF2] hover:text-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        aria-label="Instagram"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                    {brand.linkedin && (
                      <a
                        href={brand.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-[#1D6FF2] hover:text-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {brand.tiktok && (
                      <a
                        href={brand.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-[#1D6FF2] hover:text-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        aria-label="TikTok"
                      >
                        <Music2 className="h-4 w-4" />
                      </a>
                    )}
                    {brand.website && (
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-[12.5px] font-bold text-[#08123A] transition-colors hover:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                <h2 className="text-[20px] font-extrabold text-[#08123A] dark:text-white">
                  {brand.name}: Joriy talaba chegirmalari
                </h2>
                <span className="rounded-full bg-[#1D6FF2]/10 px-3 py-0.5 text-[12px] font-extrabold text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300">
                  {displayOffers.length}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {displayOffers.map((offer) => {
                  const offerImg = offer.image_url || brand.cover_url;
                  const isOfferLiked = api.isOfferLiked(offer.id, likedIds);
                  return (
                    <div
                      key={offer.id}
                      onClick={() => {
                        setSelectedOffer(offer);
                        setActivatedCode(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_14px_34px_-20px_rgba(8,18,58,0.16)] transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:flex-row"
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
                        {/* Mobilda pastki 25% dan, desktopda o'ng 25% dan boshlanuvchi progressiv blur */}
                        <CardImageBlur direction="bottom-sm-right" />

                        <span className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-extrabold text-[#002D96] shadow-sm">
                          <Sparkles className="h-3 w-3 text-[#1D6FF2]" />
                          {offer.discount || 'Yangi'}
                        </span>
                      </div>

                      <div className="relative flex flex-1 flex-col justify-between p-5">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-[17px] font-extrabold text-[#08123A] group-hover:text-[#1D6FF2] dark:text-white dark:group-hover:text-sky-400">
                              {offer.title_uz || offer.title?.uz || `${brand.name} talaba chegirmasi`}
                            </h3>
                            <p className="mt-1.5 text-[12.5px] font-medium text-slate-500 dark:text-slate-400">
                              Amal qiladi: {offer.valid_until || '31/12/2026'} gacha •{' '}
                              {offer.redemption === 'app' ? 'Online' : 'Filialda (On-site)'}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleOfferLikeClick(e, offer.id)}
                            aria-label="Chegirmani saqlash"
                            title="Chegirmani saqlash"
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200/90 bg-white text-[#08123A] shadow-sm transition-transform hover:scale-110 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          >
                            <Heart
                              className={cn(
                                'h-4 w-4 transition-colors',
                                isOfferLiked
                                  ? 'fill-rose-500 text-rose-500'
                                  : 'fill-transparent text-[#08123A] dark:text-slate-200'
                              )}
                            />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOffer(offer);
                            setActivatedCode(null);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="mt-5 flex h-11 w-full items-center justify-center rounded-full bg-[#1D6FF2]/12 px-6 text-[13px] font-extrabold text-[#002D96] transition-colors hover:bg-[#1D6FF2]/20 dark:bg-sky-500/15 dark:text-sky-300 dark:hover:bg-sky-500/25"
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

      {/* XARITADA KO'RISH MODALI */}
      {mapModalOpen && showBrandMap && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#08123A]/60 p-4 backdrop-blur-sm"
          onClick={() => setMapModalOpen(false)}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div>
                <h3 className="text-[16px] font-extrabold text-[#08123A] dark:text-white">
                  {brand.name} — Xaritadagi filiallar ({locations.length})
                </h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                  {activeBranch?.address || 'Toshkent shahri'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMapModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="h-80 w-full bg-slate-100 dark:bg-slate-800">
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
                      ? 'border-[#1D6FF2] bg-[#1D6FF2]/10 dark:border-sky-400 dark:bg-sky-500/15'
                      : 'border-slate-100 bg-slate-50 hover:bg-white dark:border-slate-800 dark:bg-slate-800/70 dark:hover:bg-slate-800'
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-extrabold text-[#08123A] dark:text-white">
                      {loc.name}
                    </p>
                    <p className="truncate text-[11.5px] text-slate-500 dark:text-slate-400">
                      {loc.address}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#002D96] px-3.5 py-1.5 text-[11.5px] font-bold text-white hover:bg-[#1D6FF2]"
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
