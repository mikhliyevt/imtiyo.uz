import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Flame, Heart } from 'lucide-react';
import AppShell, { openAuthPromptModal } from '@/components/AppShell';
import CategoryPills from '@/components/CategoryPills';
import CardImageBlur from '@/components/CardImageBlur';
import { HomeGridSkeleton } from '@/components/PageSkeleton';
import { useStudent } from '@/lib/StudentContext';
import { api, DEFAULT_CATEGORIES } from '@/services/api';
import { cn } from '@/lib/utils';

const CLONES_BEFORE = 2;
const CLONES_AFTER = 3;

function getViewportMode() {
  if (typeof window === 'undefined') return 'lg';
  if (window.innerWidth >= 1024) return 'lg';
  if (window.innerWidth >= 768) return 'md';
  return 'sm';
}

export default function Home() {
  const { profile } = useStudent();
  const [searchParams, setSearchParams] = useSearchParams();

  const [brands, setBrands] = useState([]);
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loadingData, setLoadingData] = useState(true);
  const [likedIds, setLikedIds] = useState(() => api.getLikedIds().map(String));

  const category = searchParams.get('cat') || 'all';
  const setCategory = useCallback(
    (nextCat) => {
      if (!nextCat || nextCat === 'all') {
        setSearchParams({});
      } else {
        setSearchParams({ cat: nextCat });
      }
    },
    [setSearchParams]
  );

  // Slayd karusel holati (silliq chap/o'ng surish animatsiyasi + cheksiz aylanish)
  const [viewportMode, setViewportMode] = useState(getViewportMode);
  const [trackPos, setTrackPos] = useState(CLONES_BEFORE);
  const [animateTrack, setAnimateTrack] = useState(true);
  const [sliderPaused, setSliderPaused] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const touchStartXRef = useRef(null);
  const trackPosRef = useRef(CLONES_BEFORE);
  const snapTimeoutRef = useRef(null);
  const partnersScrollRef = useRef(null);

  useEffect(() => {
    const onResize = () => setViewportMode(getViewportMode());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    trackPosRef.current = trackPos;
  }, [trackPos]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.listBrands(),
      api.listAllOffers(),
      api.listCategories(),
    ])
      .then(([bList, oList, cList]) => {
        if (!mounted) return;
        setBrands(Array.isArray(bList) ? bList : []);
        setOffers(Array.isArray(oList) ? oList : []);
        if (Array.isArray(cList) && cList.length) setCategories(cList);
      })
      .finally(() => {
        if (mounted) setLoadingData(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const sync = () => setLikedIds(api.getLikedIds().map(String));
    window.addEventListener('imtiyo_likes_changed', sync);
    return () => window.removeEventListener('imtiyo_likes_changed', sync);
  }, []);

  useEffect(() => {
    setAnimateTrack(false);
    setTrackPos(CLONES_BEFORE);
    trackPosRef.current = CLONES_BEFORE;
  }, [category]);

  const activeCategoryObj = useMemo(
    () =>
      categories.find((c) => c.id === category) || {
        id: 'all',
        label_uz: 'Tavsiya etilganlar',
      },
    [categories, category]
  );

  const categoryBrands = useMemo(() => {
    if (category === 'all') return brands;
    if (category === 'new') {
      const news = brands.filter((b) => (b.sections || []).includes('new'));
      return news.length > 0 ? news : brands;
    }
    return brands.filter(
      (b) =>
        b.category === category ||
        (Array.isArray(b.categories) && b.categories.includes(category))
    );
  }, [brands, category]);

  const sliderBrands = useMemo(
    () => (categoryBrands.length > 0 ? categoryBrands : brands),
    [categoryBrands, brands]
  );

  const extendedSlides = useMemo(() => {
    const n = sliderBrands.length;
    if (n <= 1) {
      return sliderBrands.map((item, idx) => ({
        item,
        origIdx: idx,
        slotKey: `single-${idx}-${item.id}`,
      }));
    }
    const list = [];
    for (let i = -CLONES_BEFORE; i < n + CLONES_AFTER; i++) {
      const origIdx = ((i % n) + n) % n;
      list.push({
        item: sliderBrands[origIdx],
        origIdx,
        slotKey: `slot-${i}-${sliderBrands[origIdx].id}`,
      });
    }
    return list;
  }, [sliderBrands]);

  const normalizeBoundary = useCallback(() => {
    const n = sliderBrands.length;
    if (n <= 1) return;
    const cur = trackPosRef.current;
    if (cur >= CLONES_BEFORE + n) {
      const wrapped = CLONES_BEFORE + ((cur - CLONES_BEFORE) % n);
      setAnimateTrack(false);
      setTrackPos(wrapped);
      trackPosRef.current = wrapped;
    } else if (cur < CLONES_BEFORE) {
      const wrapped = CLONES_BEFORE + ((((cur - CLONES_BEFORE) % n) + n) % n);
      setAnimateTrack(false);
      setTrackPos(wrapped);
      trackPosRef.current = wrapped;
    }
  }, [sliderBrands.length]);

  const stepSlide = useCallback(
    (delta) => {
      const n = sliderBrands.length;
      if (n <= 1) return;
      if (snapTimeoutRef.current) {
        window.clearTimeout(snapTimeoutRef.current);
      }
      setAnimateTrack(true);
      setTrackPos((prev) => {
        const next = prev + delta;
        // Clone chegarasidan oshib ketmaslik uchun himoya
        if (next > CLONES_BEFORE + n) return prev;
        if (next < CLONES_BEFORE - 1) return prev;
        trackPosRef.current = next;
        return next;
      });
      snapTimeoutRef.current = window.setTimeout(normalizeBoundary, 620);
    },
    [sliderBrands.length, normalizeBoundary]
  );

  useEffect(() => {
    return () => {
      if (snapTimeoutRef.current) window.clearTimeout(snapTimeoutRef.current);
    };
  }, []);

  // Barqaror autoplay taymeri (har 4.2 soniyada silliq chapga suriladi)
  useEffect(() => {
    if (sliderBrands.length <= 1 || sliderPaused) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      stepSlide(1);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [sliderBrands.length, sliderPaused, stepSlide]);

  const activeSlideIdx = useMemo(() => {
    const n = sliderBrands.length;
    if (n <= 1) return 0;
    return (((trackPos - CLONES_BEFORE) % n) + n) % n;
  }, [trackPos, sliderBrands.length]);

  const hasDesktopPeeks = viewportMode === 'lg' && sliderBrands.length > 2;
  const slotWidthPct = hasDesktopPeeks
    ? 35
    : viewportMode === 'md' && sliderBrands.length > 1
      ? 50
      : 100;
  const baseOffsetPct = hasDesktopPeeks ? 15 : 0;

  const handleTouchStart = (e) => {
    if (sliderBrands.length <= 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    setSliderPaused(true);
    setAnimateTrack(false);
  };

  const handleTouchMove = (e) => {
    if (touchStartXRef.current === null) return;
    const dx = e.touches[0].clientX - touchStartXRef.current;
    setDragOffsetPx(dx);
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null) return;
    const dx = dragOffsetPx;
    touchStartXRef.current = null;
    setDragOffsetPx(0);
    setSliderPaused(false);
    if (Math.abs(dx) > 45) {
      stepSlide(dx < 0 ? 1 : -1);
    } else {
      setAnimateTrack(true);
    }
  };

  const categoryDiscountCards = useMemo(() => {
    const cards = [];
    categoryBrands.forEach((brand) => {
      const brandOffers = offers.filter((o) => String(o.brand_id) === String(brand.id));
      if (brandOffers.length > 0) {
        brandOffers.forEach((o) => {
          cards.push({
            id: o.id,
            brandId: brand.id,
            brandName: brand.name,
            logoUrl: brand.logo_url,
            monogram: brand.monogram || (brand.name || 'I').slice(0, 2).toUpperCase(),
            coverUrl: o.image_url || brand.cover_url,
            accent: brand.accent || '#002D96',
            accent2: brand.accent2 || '#1D6FF2',
            title: `${o.discount || brand.discount} — ${o.title_uz || o.title?.uz || brand.name}`,
            validUntil: o.valid_until || brand.valid_until || '31/12/2026',
            redemption: o.redemption || brand.redemption || 'qr',
            activations: o.activations_count || brand.activations_count || 320,
          });
        });
      } else {
        cards.push({
          id: `default-${brand.id}`,
          brandId: brand.id,
          brandName: brand.name,
          logoUrl: brand.logo_url,
          monogram: brand.monogram || (brand.name || 'I').slice(0, 2).toUpperCase(),
          coverUrl: brand.cover_url,
          accent: brand.accent || '#002D96',
          accent2: brand.accent2 || '#1D6FF2',
          title: `${brand.discount} — ${brand.tagline?.uz || `${brand.name} talaba chegirmasi`}`,
          validUntil: brand.valid_until || '31/12/2026',
          redemption: brand.redemption || 'qr',
          activations: brand.activations_count || 280,
        });
      }
    });
    return cards;
  }, [categoryBrands, offers]);

  const handleToggleLike = (e, offerId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profile?.signedIn) {
      openAuthPromptModal('like');
      return;
    }
    api.toggleOfferLike(offerId);
  };

  const scrollPartners = (dir) => {
    if (!partnersScrollRef.current) return;
    partnersScrollRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  const renderSlideCard = (item) => {
    if (!item) return null;
    const itemOffer = offers.find((o) => String(o.brand_id) === String(item.id));
    const slideHeadline =
      itemOffer?.title_uz || item.tagline?.uz || `${item.discount} talaba chegirmasi`;

    return (
      <div
        className="relative flex h-[250px] w-full flex-col justify-between overflow-hidden rounded-[26px] p-5 text-white shadow-[0_20px_50px_-22px_rgba(8,18,58,0.45)] transition-transform duration-500 ease-out md:h-[270px]"
        style={{
          background: `linear-gradient(135deg, ${item.accent || '#002D96'}, ${
            item.accent2 || '#1D6FF2'
          })`,
        }}
      >
        {item.cover_url && (
          <img
            src={item.cover_url}
            alt={item.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
        <div className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-white/15 blur-xl" />
        <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-black/40 blur-xl" />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[16px] bg-white p-2 text-[18px] font-black text-[#08123A] shadow-lg sm:h-20 sm:w-20 sm:rounded-[18px]">
            {item.logo_url ? (
              <img
                src={item.logo_url}
                alt={item.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <span style={{ color: item.accent || '#002D96' }}>{item.monogram}</span>
            )}
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF3E6]/95 px-3 py-1 text-[11.5px] font-extrabold text-[#D9531E] shadow-sm backdrop-blur-md">
            <Flame className="h-3.5 w-3.5 fill-[#FF6B00] text-[#FF6B00]" />
            {(item.activations_count || 420).toLocaleString()} aktivatsiya
          </span>
        </div>

        <div className="relative z-10 mt-auto rounded-2xl bg-black/25 p-3 backdrop-blur-[4px]">
          <p className="text-[12.5px] font-bold text-white/90">{item.name}</p>
          <h3 className="mt-0.5 line-clamp-1 text-[19px] font-black leading-tight tracking-tight text-white md:text-[22px]">
            {item.discount} · {slideHeadline}
          </h3>
          <p className="mt-1 text-[11.5px] font-medium text-white/80">
            Amal qiladi: {item.valid_until || '31/12/2026'} gacha •{' '}
            {item.redemption === 'app' ? 'Online' : 'Kassada'}
          </p>
        </div>
      </div>
    );
  };

  const breadcrumbs =
    category === 'all' ? [] : [{ label: activeCategoryObj.label_uz }];

  return (
    <AppShell breadcrumbs={breadcrumbs} showImtiyoAbout={true}>
      <div className="space-y-8">
        {/* 1. KATEGORIYALAR NAVIGATSIYASI */}
        <CategoryPills value={category} onChange={setCategory} />

        {/* 2. BO'LIM SARLAVHASI VA SILLIQ SURILUVCHI + PROGRESSIV BLURLI SLAYDER */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[26px] font-black tracking-tight text-[#08123A] dark:text-white md:text-[32px]">
                {activeCategoryObj.label_uz}
              </h1>
              <p className="mt-0.5 text-[13.5px] font-medium text-slate-500 dark:text-slate-400">
                Eng so‘nggi talaba chegirmalari va imtiyozlarini o‘tkazib yubormang — har kuni
                yangilanadi!
              </p>
            </div>

            {sliderBrands.length > 1 && (
              <div className="flex items-center gap-2 lg:hidden">
                <button
                  type="button"
                  onClick={() => stepSlide(-1)}
                  aria-label="Oldingi slayd"
                  className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-[#08123A] shadow-sm hover:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => stepSlide(1)}
                  aria-label="Keyingi slayd"
                  className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-[#08123A] shadow-sm hover:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {loadingData ? (
            <HomeGridSkeleton />
          ) : (
            <>
              {sliderBrands.length > 0 && (
                <div
                  className="relative"
                  onMouseEnter={() => setSliderPaused(true)}
                  onMouseLeave={() => setSliderPaused(false)}
                >
                  {sliderBrands.length === 1 ? (
                    <Link
                      to={`/brand/${sliderBrands[0].id}?cat=${category}`}
                      onMouseEnter={() => api.prefetchBrand(sliderBrands[0].id)}
                      className="group block"
                    >
                      {renderSlideCard(sliderBrands[0])}
                    </Link>
                  ) : viewportMode === 'lg' && sliderBrands.length === 2 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {sliderBrands.map((item) => (
                        <Link
                          key={item.id}
                          to={`/brand/${item.id}?cat=${category}`}
                          onMouseEnter={() => api.prefetchBrand(item.id)}
                          className="group block"
                        >
                          {renderSlideCard(item)}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="relative overflow-hidden py-1"
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      {/* SILLIQ CHAP/O'NG SURILUVCHI SLAYD TREKI */}
                      <div
                        onTransitionEnd={(e) => {
                          if (e.target === e.currentTarget && e.propertyName === 'transform') {
                            normalizeBoundary();
                          }
                        }}
                        className="flex will-change-transform"
                        style={{
                          transform: `translate3d(calc(${baseOffsetPct}% - ${
                            trackPos * slotWidthPct
                          }% + ${dragOffsetPx}px), 0, 0)`,
                          transition: animateTrack
                            ? 'transform 580ms cubic-bezier(0.22, 1, 0.36, 1)'
                            : 'none',
                        }}
                      >
                        {extendedSlides.map(({ item, slotKey }) => (
                          <div
                            key={slotKey}
                            className="shrink-0 px-1.5 sm:px-2"
                            style={{ width: `${slotWidthPct}%` }}
                          >
                            <Link
                              to={`/brand/${item.id}?cat=${category}`}
                              onMouseEnter={() => api.prefetchBrand(item.id)}
                              className="group block"
                            >
                              {renderSlideCard(item)}
                            </Link>
                          </div>
                        ))}
                      </div>

                      {/* CHAP CHETDAGI PROGRESSIV BLUR ZONASI (FAKAT TASHQI YARMIDA: 25% -> 50% -> 75%) */}
                      {hasDesktopPeeks && (
                        <div
                          onClick={() => stepSlide(-1)}
                          className="absolute inset-y-1 left-0 z-20 hidden w-[15%] cursor-pointer select-none overflow-hidden rounded-r-[26px] lg:block"
                        >
                          <div className="imtiyo-blur-layer imtiyo-blur-left-1" />
                          <div className="imtiyo-blur-layer imtiyo-blur-left-2" />
                          <div className="imtiyo-blur-layer imtiyo-blur-left-3" />
                          <div className="pointer-events-none absolute inset-y-0 left-0 w-[44%] bg-gradient-to-r from-white/65 via-white/20 to-transparent dark:from-[#070d1f]/80 dark:via-[#070d1f]/25 dark:to-transparent" />

                          <button
                            type="button"
                            aria-label="Oldingi slayd"
                            className="absolute left-3.5 top-1/2 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-[#002D96]/90 text-white shadow-lg backdrop-blur-md transition-transform hover:scale-110 hover:bg-[#1D6FF2]"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                        </div>
                      )}

                      {/* O'NG CHETDAGI PROGRESSIV BLUR ZONASI (CHAP TOMONNING KO'ZGUDAGI AKSI) */}
                      {hasDesktopPeeks && (
                        <div
                          onClick={() => stepSlide(1)}
                          className="absolute inset-y-1 right-0 z-20 hidden w-[15%] cursor-pointer select-none overflow-hidden rounded-l-[26px] lg:block"
                        >
                          <div className="imtiyo-blur-layer imtiyo-blur-right-1" />
                          <div className="imtiyo-blur-layer imtiyo-blur-right-2" />
                          <div className="imtiyo-blur-layer imtiyo-blur-right-3" />
                          <div className="pointer-events-none absolute inset-y-0 right-0 w-[44%] bg-gradient-to-l from-white/65 via-white/20 to-transparent dark:from-[#070d1f]/80 dark:via-[#070d1f]/25 dark:to-transparent" />

                          <button
                            type="button"
                            aria-label="Keyingi slayd"
                            className="absolute right-3.5 top-1/2 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-[#002D96]/90 text-white shadow-lg backdrop-blur-md transition-transform hover:scale-110 hover:bg-[#1D6FF2]"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Slayder nuqtalari */}
                  {sliderBrands.length > 2 && (
                    <div className="mt-3 flex items-center justify-center gap-1.5">
                      {sliderBrands.slice(0, 8).map((b, idx) => {
                        const isActive = activeSlideIdx % Math.min(sliderBrands.length, 8) === idx;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            aria-label={`Slayd ${idx + 1}`}
                            onClick={() => {
                              setAnimateTrack(true);
                              const nextPos = CLONES_BEFORE + idx;
                              setTrackPos(nextPos);
                              trackPosRef.current = nextPos;
                            }}
                            className={cn(
                              'h-1.5 rounded-full transition-all duration-300',
                              isActive
                                ? 'w-6 bg-[#1D6FF2] dark:bg-sky-400'
                                : 'w-1.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-500'
                            )}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 3. HAMKORLAR QATORI */}
              {categoryBrands.length > 0 && (
                <section className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[19px] font-extrabold text-[#08123A] dark:text-white">
                      {category === 'all'
                        ? 'Hamkorlar (Partners)'
                        : `${activeCategoryObj.label_uz} bo‘yicha hamkorlar`}
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => scrollPartners(-1)}
                        aria-label="Chapga surish"
                        className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-[#1D6FF2] hover:text-[#002D96] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-400"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollPartners(1)}
                        aria-label="O‘ngga surish"
                        className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-[#1D6FF2] hover:text-[#002D96] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-400"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div
                    ref={partnersScrollRef}
                    className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {categoryBrands.map((b) => (
                      <Link
                        key={b.id}
                        to={`/brand/${b.id}?cat=${category}`}
                        onMouseEnter={() => api.prefetchBrand(b.id)}
                        className="group flex w-[112px] shrink-0 flex-col items-center text-center"
                      >
                        <div className="grid h-[104px] w-[104px] place-items-center overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-3 shadow-[0_8px_24px_-12px_rgba(8,18,58,0.12)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-md dark:border-slate-700/80">
                          {b.logo_url ? (
                            <img
                              src={b.logo_url}
                              alt={b.name}
                              loading="lazy"
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span
                              className="text-[26px] font-black"
                              style={{ color: b.accent || '#002D96' }}
                            >
                              {b.monogram}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2 text-[12px] font-bold leading-snug text-[#08123A] group-hover:text-[#002D96] dark:text-slate-200 dark:group-hover:text-sky-400">
                          {b.name}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* 4. BO'LIMDAGI BARCHA CHEGIRMALAR */}
              <section className="space-y-4 pt-4">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[20px] font-extrabold text-[#08123A] dark:text-white">
                    {category === 'all'
                      ? 'Barcha chegirmalar'
                      : `${activeCategoryObj.label_uz} bo‘yicha barcha chegirmalar`}
                  </h2>
                  <span className="rounded-full bg-[#1D6FF2]/10 px-3 py-0.5 text-[12px] font-extrabold text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300">
                    {categoryDiscountCards.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  {categoryDiscountCards.map((card) => {
                    const isLiked = api.isOfferLiked(card.id, likedIds);

                    return (
                      <Link
                        key={card.id}
                        to={`/brand/${card.brandId}?cat=${category}&offer=${encodeURIComponent(card.id)}`}
                        onMouseEnter={() => api.prefetchBrand(card.brandId)}
                        className="group flex flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_12px_32px_-18px_rgba(8,18,58,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_12px_32px_-18px_rgba(0,0,0,0.6)]"
                      >
                        <div
                          className="relative h-44 w-full overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${card.accent}, ${card.accent2})`,
                          }}
                        >
                          {card.coverUrl && (
                            <img
                              src={card.coverUrl}
                              alt={card.brandName}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          )}

                          {/* Pastki 25% dan boshlanuvchi 3-qatlamli progressiv blur */}
                          <CardImageBlur direction="bottom" />

                          {/* Brend logosi (oq kvadratda) */}
                          <div className="absolute left-3 top-3 z-10 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-md">
                            {card.logoUrl ? (
                              <img
                                src={card.logoUrl}
                                alt={card.brandName}
                                loading="lazy"
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <span
                                className="text-[16px] font-black"
                                style={{ color: card.accent }}
                              >
                                {card.monogram}
                              </span>
                            )}
                          </div>

                          {/* Yurakcha tugmasi */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleLike(e, card.id)}
                            aria-label="Saqlash"
                            className="absolute bottom-2 right-3 z-20 grid h-9 w-9 place-items-center rounded-full border border-slate-200/80 bg-white text-[#08123A] shadow-md transition-transform hover:scale-110 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          >
                            <Heart
                              className={cn(
                                'h-4 w-4 transition-colors',
                                isLiked
                                  ? 'fill-rose-500 text-rose-500'
                                  : 'fill-transparent text-[#08123A] dark:text-slate-200'
                              )}
                            />
                          </button>
                        </div>

                        <div className="flex flex-1 flex-col justify-between p-4 pt-2">
                          <div>
                            <p className="text-[11.5px] font-semibold text-slate-400 dark:text-slate-400">
                              {card.brandName}
                            </p>
                            <h3 className="mt-1 line-clamp-2 text-[14px] font-extrabold leading-snug text-[#08123A] group-hover:text-[#002D96] dark:text-slate-100 dark:group-hover:text-sky-400">
                              {card.title}
                            </h3>
                          </div>

                          <div className="mt-3 space-y-2">
                            <p className="text-[11.5px] font-medium text-slate-400">
                              {card.validUntil} gacha •{' '}
                              {card.redemption === 'app' ? 'Online' : 'Kassada'}
                            </p>

                            <div>
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF3E6] px-2.5 py-0.5 text-[11px] font-extrabold text-[#D9531E] dark:bg-orange-500/15 dark:text-orange-300">
                                <Flame className="h-3 w-3 fill-[#FF6B00] text-[#FF6B00]" />
                                {Number(card.activations).toLocaleString()} aktivatsiya
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}
