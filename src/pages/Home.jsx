import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Heart,
  Home as HomeIcon,
} from 'lucide-react';
import AppShell, { openAuthPromptModal } from '@/components/AppShell';
import CategoryPills from '@/components/CategoryPills';
import { useStudent } from '@/lib/StudentContext';
import { api, DEFAULT_CATEGORIES } from '@/services/api';
import { cn } from '@/lib/utils';

export default function Home() {
  const { profile } = useStudent();

  const [brands, setBrands] = useState([]);
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [category, setCategory] = useState('all');
  const [likedIds, setLikedIds] = useState(() => api.getLikedIds().map(String));

  // Slayd indeksi va animatsiya holati
  const [slideIdx, setSlideIdx] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const partnersScrollRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.listBrands(),
      api.listAllOffers(),
      api.listCategories(),
    ]).then(([bList, oList, cList]) => {
      setBrands(Array.isArray(bList) ? bList : []);
      setOffers(Array.isArray(oList) ? oList : []);
      if (Array.isArray(cList) && cList.length) setCategories(cList);
    });
  }, []);

  useEffect(() => {
    const sync = () => setLikedIds(api.getLikedIds().map(String));
    window.addEventListener('imtiyo_likes_changed', sync);
    return () => window.removeEventListener('imtiyo_likes_changed', sync);
  }, []);

  // Kategoriya o'zgarganda slaydni 0-indeksga qaytarish
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

  // Tanlangan bo'limga (masalan, "Taomlar" yoki "Yangilar") oid brendlar
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

  // Shu bo'limning Slayd elementlari
  const sliderBrands = useMemo(() => {
    return categoryBrands.length > 0 ? categoryBrands : brands;
  }, [categoryBrands, brands]);

  const triggerSlideChange = (nextIndex) => {
    if (sliderBrands.length <= 1) return;
    setIsAnimating(true);
    setSlideIdx(((nextIndex % sliderBrands.length) + sliderBrands.length) % sliderBrands.length);
    setTimeout(() => setIsAnimating(false), 450);
  };

  // Har 3.5 sekundda silliq animatsiya bilan o'ngga o'tish
  useEffect(() => {
    if (sliderBrands.length <= 1) return;
    const timer = setInterval(() => {
      triggerSlideChange(slideIdx + 1);
    }, 3500);
    return () => clearInterval(timer);
  }, [sliderBrands.length, slideIdx]);

  const getSlideAt = (offset) => {
    if (sliderBrands.length === 0) return null;
    const len = sliderBrands.length;
    const index = (((slideIdx + offset) % len) + len) % len;
    return sliderBrands[index];
  };

  // Shu bo'limga oid barcha chegirmalar (Offers + Brendlar)
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

  // 4-RASMDAGIDEK SLAYD KARTOCHKASI (Katta oq logo kvadrati, burchak va pastki qismi blur, aktivatsiya soni)
  const renderSlideCard = (item, isSideBlur = false) => {
    if (!item) return null;
    const itemOffer = offers.find((o) => String(o.brand_id) === String(item.id));
    const slideHeadline =
      itemOffer?.title_uz ||
      item.tagline?.uz ||
      `${item.discount} talaba chegirmasi`;

    return (
      <div
        className={cn(
          'relative flex h-[250px] w-full flex-col justify-between overflow-hidden rounded-[26px] p-5 text-white shadow-[0_20px_50px_-22px_rgba(8,18,58,0.45)] transition-all duration-500 ease-out md:h-[270px]',
          isAnimating && !isSideBlur && 'scale-[0.98] opacity-90'
        )}
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
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}

        {/* Burchaklarda va pastki qismda yumshoq blur hamda qoraytirilgan gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
        <div className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-white/15 blur-xl" />
        <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-black/40 blur-xl" />

        {/* Tepa qism: Chapda KATTA OQ KVADRAT LOGO (4-rasm), O'ngda aktivatsiyalar yorlig'i */}
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[18px] bg-white p-2 text-[20px] font-black text-[#08123A] shadow-lg">
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

        {/* Pastki qism: Brend nomi, Katta chegirma sarlavhasi, Amal qilish muddati */}
        <div className="relative z-10 mt-auto rounded-2xl bg-black/20 p-3 backdrop-blur-[3px]">
          <p className="text-[12.5px] font-bold text-white/90">{item.name}</p>
          <h3 className="mt-0.5 line-clamp-1 text-[20px] font-black leading-tight tracking-tight text-white md:text-[22px]">
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

  return (
    <AppShell>
      <div className="space-y-8">
        {/* 1. KATEGORIYALAR NAVIGATSIYASI */}
        <CategoryPills
          value={category}
          onChange={(catId) => {
            setCategory(catId);
          }}
        />

        {/* Breadcrumb (agar "all" bo'lmasa) */}
        {category !== 'all' && (
          <div className="flex items-center gap-2 text-[12.5px] font-bold text-slate-500">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className="inline-flex items-center gap-1 hover:text-[#002D96]"
            >
              <HomeIcon className="h-3.5 w-3.5" />
              <span>Asosiy</span>
            </button>
            <span>›</span>
            <span className="text-[#5B21B6]">{activeCategoryObj.label_uz}</span>
          </div>
        )}

        {/* 2. BO'LIM SARLAVHASI VA 4-RASMDAGIDEK HAR BIR BO'LIMNING MAXSUS SLAYDI */}
        <section className="space-y-4">
          <div>
            <h1 className="text-[26px] font-black tracking-tight text-[#08123A] md:text-[32px]">
              {activeCategoryObj.label_uz}
            </h1>
            <p className="mt-0.5 text-[13.5px] font-medium text-slate-500">
              Eng so‘nggi talaba chegirmalari va imtiyozlarini o‘tkazib yubormang — har kuni
              yangilanadi!
            </p>
          </div>

          {sliderBrands.length > 0 && (
            <div className="relative">
              <div className="flex items-center justify-center gap-4 overflow-hidden py-1">
                {/* Chap chetdagi yarim ko'rinuvchi blur slayd + Chap strelka */}
                {getSlideAt(-1) && (
                  <div
                    onClick={() => triggerSlideChange(slideIdx - 1)}
                    className="relative hidden w-[14%] shrink-0 cursor-pointer select-none overflow-hidden rounded-[26px] lg:block"
                  >
                    <div className="pointer-events-none opacity-45 blur-[2.5px] scale-95">
                      {renderSlideCard(getSlideAt(-1), true)}
                    </div>
                    <button
                      type="button"
                      aria-label="Oldingi slayd"
                      className="absolute left-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-[#5B21B6] text-white shadow-lg transition-transform hover:scale-110"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {/* O'RTADAGI 2 TA ASOSIY SLAYD (4-RASM DIZAYNI) */}
                <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:w-[72%]">
                  {[0, 1].map((offset) => {
                    const item = getSlideAt(offset);
                    if (!item) return null;
                    return (
                      <Link
                        key={`${item.id}-${offset}`}
                        to={`/brand/${item.id}?cat=${category}`}
                        className="group block"
                      >
                        {renderSlideCard(item, false)}
                      </Link>
                    );
                  })}
                </div>

                {/* O'ng chetdagi yarim ko'rinuvchi blur slayd + O'ng strelka */}
                {getSlideAt(2) && (
                  <div
                    onClick={() => triggerSlideChange(slideIdx + 1)}
                    className="relative hidden w-[14%] shrink-0 cursor-pointer select-none overflow-hidden rounded-[26px] lg:block"
                  >
                    <div className="pointer-events-none opacity-45 blur-[2.5px] scale-95">
                      {renderSlideCard(getSlideAt(2), true)}
                    </div>
                    <button
                      type="button"
                      aria-label="Keyingi slayd"
                      className="absolute right-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-[#5B21B6] text-white shadow-lg transition-transform hover:scale-110"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* =========================================================
            3. SLAYD TAGIDAN HAMKORLAR QATORI (5 va 6-RASMDAGIDEK "Partners in ...")
        ========================================================= */}
        {categoryBrands.length > 0 && (
          <section className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-[19px] font-extrabold text-[#08123A]">
                {category === 'all'
                  ? 'Hamkorlar (Partners)'
                  : `${activeCategoryObj.label_uz} bo‘yicha hamkorlar`}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollPartners(-1)}
                  className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-2xs hover:border-[#08123A]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollPartners(1)}
                  className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-2xs hover:border-[#08123A]"
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
                  className="group flex w-[112px] shrink-0 flex-col items-center text-center"
                >
                  <div className="grid h-[104px] w-[104px] place-items-center overflow-hidden rounded-[22px] border border-slate-100 bg-white p-3 shadow-[0_8px_24px_-12px_rgba(8,18,58,0.12)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
                    {b.logo_url ? (
                      <img
                        src={b.logo_url}
                        alt={b.name}
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
                  <p className="mt-2 line-clamp-2 text-[12px] font-bold leading-snug text-[#08123A] group-hover:text-[#002D96]">
                    {b.name}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================
            4. BO'LIMDAGI BARCHA CHEGIRMALAR (6-RASMDAGIDEK DIZAYN: RASM PASTI BLUR, KATTA LOGO, OQ YURAKCHA, MUDDAT VA AKTIVATSIYA)
        ========================================================= */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[20px] font-extrabold text-[#08123A]">
              {category === 'all'
                ? 'Barcha chegirmalar'
                : `${activeCategoryObj.label_uz} bo‘yicha barcha chegirmalar`}
            </h2>
            <span className="rounded-full bg-[#EDE9FE] px-3 py-0.5 text-[12px] font-extrabold text-[#5B21B6]">
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
                  className="group flex flex-col overflow-hidden rounded-[22px] border border-slate-200/70 bg-white shadow-[0_12px_32px_-18px_rgba(8,18,58,0.18)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Rasm qismi + Pastki blur qatlami + Chap tepada Katta Oq Logo + O'ng pastda Oq Yurakcha */}
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
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}

                    {/* Rasmning pastki qismi ozgina blurlangan (6-rasm) */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/70 to-transparent backdrop-blur-[2px]" />

                    {/* Chap tepada brend logosi (6-rasmdagidek katta oq kvadratda) */}
                    <div className="absolute left-3 top-3 z-10 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-md">
                      {card.logoUrl ? (
                        <img
                          src={card.logoUrl}
                          alt={card.brandName}
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

                    {/* O'ng pastki burchakda oq dumaloq yurakcha (6-rasm) */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleLike(e, card.id)}
                      aria-label="Saqlash"
                      className="absolute bottom-2 right-3 z-20 grid h-9 w-9 place-items-center rounded-full border border-slate-200/80 bg-white text-[#08123A] shadow-md transition-transform hover:scale-110"
                    >
                      <Heart
                        className={cn(
                          'h-4 w-4 transition-colors',
                          isLiked
                            ? 'fill-[#08123A] text-[#08123A]'
                            : 'fill-transparent text-[#08123A]'
                        )}
                      />
                    </button>
                  </div>

                  {/* Matn qismi: Brend nomi, Chegirma sarlavhasi, Amal qilish muddati va Aktivatsiya soni */}
                  <div className="flex flex-1 flex-col justify-between p-4 pt-2">
                    <div>
                      <p className="text-[11.5px] font-semibold text-slate-400">
                        {card.brandName}
                      </p>
                      <h3 className="mt-1 line-clamp-2 text-[14px] font-extrabold leading-snug text-[#08123A] group-hover:text-[#002D96]">
                        {card.title}
                      </h3>
                    </div>

                    <div className="mt-3 space-y-2">
                      <p className="text-[11.5px] font-medium text-slate-400">
                        {card.validUntil} gacha •{' '}
                        {card.redemption === 'app' ? 'Online' : 'Kassada'}
                      </p>

                      <div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF3E6] px-2.5 py-0.5 text-[11px] font-extrabold text-[#D9531E]">
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
      </div>
    </AppShell>
  );
}