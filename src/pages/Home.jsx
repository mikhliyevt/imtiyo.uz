import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Flame, Heart } from 'lucide-react';
import AppShell, { openAuthPromptModal } from '@/components/AppShell';
import CategoryPills from '@/components/CategoryPills';
import { HomeGridSkeleton } from '@/components/PageSkeleton';
import { useStudent } from '@/lib/StudentContext';
import { api, DEFAULT_CATEGORIES } from '@/services/api';
import { cn } from '@/lib/utils';

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

  // Slayd indeksi, yo'nalishi va hover pauzasi
  const [slideIdx, setSlideIdx] = useState(0);
  const [slideDir, setSlideDir] = useState('next');
  const [sliderPaused, setSliderPaused] = useState(false);
  const partnersScrollRef = useRef(null);

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
    setSlideIdx(0);
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

  const stepSlide = useCallback(
    (delta) => {
      if (sliderBrands.length <= 1) return;
      setSlideDir(delta >= 0 ? 'next' : 'prev');
      setSlideIdx((prev) => (((prev + delta) % sliderBrands.length) + sliderBrands.length) % sliderBrands.length);
    },
    [sliderBrands.length]
  );

  // Barqaror autoplay taymeri (hover bo'lganda to'xtaydi, har tickda qayta yaratilmaydi)
  useEffect(() => {
    if (sliderBrands.length <= 1 || sliderPaused) return;
    const timer = window.setInterval(() => {
      setSlideDir('next');
      setSlideIdx((prev) => (prev + 1) % sliderBrands.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [sliderBrands.length, sliderPaused]);

  const getSlideAt = (offset) => {
    if (sliderBrands.length === 0) return null;
    const len = sliderBrands.length;
    const index = (((slideIdx + offset) % len) + len) % len;
    return sliderBrands[index];
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
          id: brand.id,
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

  const handleToggleLike = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profile?.signedIn) {
      openAuthPromptModal('like');
      return;
    }
    api.toggleLike(id);
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

  const animClass =
    slideDir === 'next' ? 'imtiyo-slide-enter-next' : 'imtiyo-slide-enter-prev';

  return (
    <AppShell breadcrumbs={breadcrumbs} showImtiyoAbout={true}>
      <div className="space-y-8">
        {/* 1. KATEGORIYALAR NAVIGATSIYASI */}
        <CategoryPills value={category} onChange={setCategory} />

        {/* 2. BO'LIM SARLAVHASI VA PROGRESSIV BLURLI SLAYDER */}
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

            {sliderBrands.length > 2 && (
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
                  <div className="flex items-center justify-center gap-4 overflow-hidden py-1">
                    {/* CHAP CHETDAGI YARIM SLAYD — FAQAT TASHQI YARMIDA PROGRESSIV BLUR (25% -> 50% -> 75%) */}
                    {sliderBrands.length > 2 && getSlideAt(-1) && (
                      <div
                        onClick={() => stepSlide(-1)}
                        className="relative hidden h-[270px] w-[15%] shrink-0 cursor-pointer select-none overflow-hidden rounded-[26px] lg:block"
                      >
                        <div
                          key={`left-${slideIdx}`}
                          className={cn(
                            'pointer-events-none absolute inset-y-0 right-0 w-[440px]',
                            animClass
                          )}
                        >
                          {renderSlideCard(getSlideAt(-1))}
                        </div>

                        {/* 3-qatlamli progressiv blur: markazga yaqin ichki qism tiniq, tashqi chetga qarab kuchayadi */}
                        <div className="imtiyo-blur-layer imtiyo-blur-left-1" />
                        <div className="imtiyo-blur-layer imtiyo-blur-left-2" />
                        <div className="imtiyo-blur-layer imtiyo-blur-left-3" />
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-[42%] bg-gradient-to-r from-white/55 via-white/15 to-transparent dark:from-[#070d1f]/75 dark:via-[#070d1f]/25 dark:to-transparent" />

                        <button
                          type="button"
                          aria-label="Oldingi slayd"
                          className="absolute left-3.5 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-[#002D96]/90 text-white shadow-lg backdrop-blur-md transition-transform hover:scale-110 hover:bg-[#1D6FF2]"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                      </div>
                    )}

                    {/* O'RTADAGI 2 TA ASOSIY SLAYD */}
                    <div
                      className={cn(
                        'grid w-full grid-cols-1 gap-4 md:grid-cols-2',
                        sliderBrands.length > 2 ? 'lg:w-[70%]' : 'lg:w-full'
                      )}
                    >
                      {[0, 1].map((offset) => {
                        if (offset === 1 && sliderBrands.length < 2) return null;
                        const item = getSlideAt(offset);
                        if (!item) return null;
                        return (
                          <Link
                            key={`${item.id}-${slideIdx}-${offset}`}
                            to={`/brand/${item.id}?cat=${category}`}
                            onMouseEnter={() => api.prefetchBrand(item.id)}
                            className={cn('group block', animClass)}
                          >
                            {renderSlideCard(item)}
                          </Link>
                        );
                      })}
                    </div>

                    {/* O'NG CHETDAGI YARIM SLAYD — CHAP TOMONNING KO'ZGUDAGI AKSI */}
                    {sliderBrands.length > 2 && getSlideAt(2) && (
                      <div
                        onClick={() => stepSlide(1)}
                        className="relative hidden h-[270px] w-[15%] shrink-0 cursor-pointer select-none overflow-hidden rounded-[26px] lg:block"
                      >
                        <div
                          key={`right-${slideIdx}`}
                          className={cn(
                            'pointer-events-none absolute inset-y-0 left-0 w-[440px]',
                            animClass
                          )}
                        >
                          {renderSlideCard(getSlideAt(2))}
                        </div>

                        {/* 3-qatlamli progressiv blur (ko'zgu aksi) */}
                        <div className="imtiyo-blur-layer imtiyo-blur-right-1" />
                        <div className="imtiyo-blur-layer imtiyo-blur-right-2" />
                        <div className="imtiyo-blur-layer imtiyo-blur-right-3" />
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-[42%] bg-gradient-to-l from-white/55 via-white/15 to-transparent dark:from-[#070d1f]/75 dark:via-[#070d1f]/25 dark:to-transparent" />

                        <button
                          type="button"
                          aria-label="Keyingi slayd"
                          className="absolute right-3.5 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-[#002D96]/90 text-white shadow-lg backdrop-blur-md transition-transform hover:scale-110 hover:bg-[#1D6FF2]"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Slayder nuqtalari */}
                  {sliderBrands.length > 2 && (
                    <div className="mt-3 flex items-center justify-center gap-1.5">
                      {sliderBrands.slice(0, 8).map((b, idx) => {
                        const isActive = slideIdx % Math.min(sliderBrands.length, 8) === idx;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            aria-label={`Slayd ${idx + 1}`}
                            onClick={() => {
                              setSlideDir(idx >= slideIdx ? 'next' : 'prev');
                              setSlideIdx(idx);
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
                    const isLiked =
                      likedIds.includes(String(card.id)) ||
                      likedIds.includes(String(card.brandId));

                    return (
                      <Link
                        key={card.id}
                        to={`/brand/${card.brandId}?cat=${category}`}
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

                          {/* Dark mode moslangan pastki yumshoq gradient */}
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/70 to-transparent backdrop-blur-[2px] dark:from-slate-900 dark:via-slate-900/75 dark:to-transparent" />

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
