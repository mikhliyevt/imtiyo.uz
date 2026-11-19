import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Flame, Heart, QrCode, Search, Smartphone, Sparkles, X } from 'lucide-react';
import AppShell, { openAuthPromptModal } from '@/components/AppShell';
import CategoryPills from '@/components/CategoryPills';
import CardImageBlur from '@/components/CardImageBlur';
import { useStudent } from '@/lib/StudentContext';
import { api, DEFAULT_CATEGORIES } from '@/services/api';
import { cn } from '@/lib/utils';

export default function Explore() {
  const { profile } = useStudent();
  const [searchParams] = useSearchParams();

  const [brands, setBrands] = useState([]);
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('cat') || 'all');
  const [onlySaved, setOnlySaved] = useState(searchParams.get('saved') === '1');
  const [likedIds, setLikedIds] = useState(() => api.getLikedIds().map(String));

  useEffect(() => {
    let active = true;
    Promise.all([api.listBrands(), api.listAllOffers(), api.listCategories()])
      .then(([bList, oList, cList]) => {
        if (!active) return;
        setBrands(Array.isArray(bList) ? bList : []);
        setOffers(Array.isArray(oList) ? oList : []);
        if (Array.isArray(cList) && cList.length) setCategories(cList);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const sync = () => setLikedIds(api.getLikedIds().map(String));
    window.addEventListener('imtiyo_likes_changed', sync);
    return () => window.removeEventListener('imtiyo_likes_changed', sync);
  }, []);

  const allDiscountCards = useMemo(() => {
    const cards = [];
    brands.forEach((brand) => {
      const brandOffers = offers.filter((o) => String(o.brand_id) === String(brand.id));
      if (brandOffers.length > 0) {
        brandOffers.forEach((o) => {
          cards.push({
            id: o.id,
            brandId: brand.id,
            brandName: brand.name,
            category: brand.category,
            categories: brand.categories || [],
            logoUrl: brand.logo_url,
            monogram: brand.monogram || (brand.name || 'I').slice(0, 2).toUpperCase(),
            coverUrl: o.image_url || brand.cover_url,
            accent: brand.accent || '#002D96',
            accent2: brand.accent2 || '#1D6FF2',
            discount: o.discount || brand.discount || '-15%',
            title: o.title_uz || o.title?.uz || `${brand.name} talaba chegirmasi`,
            validUntil: o.valid_until || brand.valid_until || '31/12/2026',
            redemption: o.redemption || brand.redemption || 'qr',
            activations: o.activations_count || brand.activations_count || 240,
          });
        });
      } else {
        cards.push({
          id: `default-${brand.id}`,
          brandId: brand.id,
          brandName: brand.name,
          category: brand.category,
          categories: brand.categories || [],
          logoUrl: brand.logo_url,
          monogram: brand.monogram || (brand.name || 'I').slice(0, 2).toUpperCase(),
          coverUrl: brand.cover_url,
          accent: brand.accent || '#002D96',
          accent2: brand.accent2 || '#1D6FF2',
          discount: brand.discount || '-20%',
          title: brand.tagline?.uz || `${brand.name} — talabalar uchun maxsus chegirma`,
          validUntil: brand.valid_until || '31/12/2026',
          redemption: brand.redemption || 'qr',
          activations: brand.activations_count || 240,
        });
      }
    });
    return cards;
  }, [brands, offers]);

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allDiscountCards.filter((card) => {
      const matchCat =
        category === 'all' ||
        card.category === category ||
        (Array.isArray(card.categories) && card.categories.includes(category));
      const matchQuery =
        !q ||
        (card.brandName || '').toLowerCase().includes(q) ||
        (card.title || '').toLowerCase().includes(q) ||
        (card.category || '').toLowerCase().includes(q) ||
        (card.discount || '').toLowerCase().includes(q);

      const isOfferLiked = api.isOfferLiked(card.id, likedIds);
      const isFallbackBrandLiked =
        String(card.id).startsWith('default-') && api.isBrandLiked(card.brandId, likedIds);
      const matchSaved = !onlySaved || isOfferLiked || isFallbackBrandLiked;

      return matchCat && matchQuery && matchSaved;
    });
  }, [allDiscountCards, category, query, onlySaved, likedIds]);

  const handleToggleLike = (e, offerId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profile?.signedIn) {
      openAuthPromptModal('like');
      return;
    }
    api.toggleOfferLike(offerId);
  };

  const activeCategoryObj = categories.find((c) => c.id === category);
  const breadcrumbs =
    category !== 'all' && activeCategoryObj
      ? [
          { label: 'Chegirmalar', onClick: () => setCategory('all') },
          { label: activeCategoryObj.label_uz },
        ]
      : [{ label: 'Chegirmalar va Qidiruv' }];

  return (
    <AppShell hideSearch breadcrumbs={breadcrumbs} showImtiyoAbout={category !== 'all'}>
      <div className="space-y-5 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-extrabold text-[#08123A] dark:text-white">
              Chegirmalar va Qidiruv
            </h1>
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
              Barcha hamkor brendlar va individual talaba chegirmalari ({filteredCards.length} ta
              natija)
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOnlySaved((v) => !v)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12.5px] font-extrabold transition-all',
              onlySaved
                ? 'border-[#002D96] bg-[#002D96] text-white shadow-sm dark:border-sky-400 dark:bg-sky-500'
                : 'border-slate-200 bg-white/90 text-[#002D96] hover:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-900 dark:text-sky-300'
            )}
          >
            <Heart
              className={cn(
                'h-4 w-4',
                onlySaved
                  ? 'fill-white text-white'
                  : 'fill-transparent text-[#002D96] dark:text-sky-300'
              )}
            />
            <span>Saqlanganlar ({likedIds.length})</span>
          </button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1D6FF2] dark:text-sky-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hamkor brend, taom, sartaroshxona yoki chegirma qidiring..."
            className="h-12 w-full rounded-full border border-slate-200/90 bg-white/95 pl-12 pr-11 text-[14px] font-bold text-[#08123A] shadow-[0_14px_32px_-22px_rgba(0,45,150,0.35)] outline-none backdrop-blur-xl focus:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-900/90 dark:text-white dark:focus:border-sky-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <CategoryPills value={category} onChange={setCategory} />

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-[26px] bg-slate-200/70 dark:bg-slate-800/80"
              />
            ))}
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-slate-300 bg-white/80 py-14 text-center dark:border-slate-700 dark:bg-slate-900/60">
            <Sparkles className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-2 text-[14px] font-extrabold text-[#08123A] dark:text-white">
              Mos chegirmalar topilmadi
            </p>
            <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
              Qidiruv so‘zini yoki kategoriyani o‘zgartirib ko‘ring.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredCards.map((card) => {
              const isLiked = api.isOfferLiked(card.id, likedIds);

              return (
                <Link
                  key={card.id}
                  to={`/brand/${card.brandId}?cat=${category}&offer=${encodeURIComponent(card.id)}`}
                  onMouseEnter={() => api.prefetchBrand(card.brandId)}
                  className="group flex flex-col overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_18px_42px_-26px_rgba(0,45,150,0.3)] transition-all duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900"
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

                    {/* Pastki 25% dan boshlanuvchi progressiv blur */}
                    <CardImageBlur direction="bottom" />

                    <span className="absolute left-3 top-3 z-10 grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 text-[14px] font-black text-[#08123A] shadow-md">
                      {card.logoUrl ? (
                        <img
                          src={card.logoUrl}
                          alt={card.brandName}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span style={{ color: card.accent }}>{card.monogram}</span>
                      )}
                    </span>

                    <span className="absolute bottom-2.5 left-3 z-10 inline-block rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-black text-[#002D96] shadow-sm">
                      {card.discount}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleToggleLike(e, card.id)}
                      aria-label="Chegirmani saqlash"
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

                  <div className="flex flex-1 flex-col justify-between p-4 pt-2.5">
                    <div>
                      <p className="text-[11.5px] font-bold text-slate-400">{card.brandName}</p>
                      <h3 className="mt-0.5 line-clamp-2 text-[14px] font-extrabold leading-snug text-[#08123A] group-hover:text-[#002D96] dark:text-slate-100 dark:group-hover:text-sky-400">
                        {card.discount} · {card.title}
                      </h3>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        {card.redemption === 'app' ? (
                          <Smartphone className="h-3.5 w-3.5 text-[#1D6FF2] dark:text-sky-400" />
                        ) : (
                          <QrCode className="h-3.5 w-3.5 text-[#1D6FF2] dark:text-sky-400" />
                        )}
                        {card.redemption === 'app' ? 'Online' : 'Kassada'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 font-extrabold text-amber-600 dark:text-amber-300">
                        <Flame className="h-3 w-3" />
                        {Number(card.activations).toLocaleString()} aktivatsiya
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
