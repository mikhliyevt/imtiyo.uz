import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Flame, Heart, QrCode, Search, Smartphone, Sparkles, X } from 'lucide-react';
import AppShell, { openAuthPromptModal } from '@/components/AppShell';
import CategoryPills from '@/components/CategoryPills';
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

  const filteredBrands = useMemo(() => {
    const q = query.trim().toLowerCase();
    return brands.filter((b) => {
      const matchCat =
        category === 'all' ||
        b.category === category ||
        (Array.isArray(b.categories) && b.categories.includes(category));
      const matchQuery =
        !q ||
        (b.name || '').toLowerCase().includes(q) ||
        (b.tagline?.uz || '').toLowerCase().includes(q) ||
        (b.category || '').toLowerCase().includes(q) ||
        (b.discount || '').toLowerCase().includes(q);

      const hasLikedOffer = offers.some(
        (o) => String(o.brand_id) === String(b.id) && likedIds.includes(String(o.id))
      );
      const isBrandLiked =
        likedIds.includes(String(b.id)) ||
        likedIds.includes(`brand-${b.id}`) ||
        likedIds.includes(`brand:${b.id}`);

      const matchSaved = !onlySaved || isBrandLiked || hasLikedOffer;
      return matchCat && matchQuery && matchSaved;
    });
  }, [brands, offers, category, query, onlySaved, likedIds]);

  const handleToggleLike = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profile?.signedIn) {
      openAuthPromptModal('like');
      return;
    }
    api.toggleLike(id);
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
              Barcha hamkor brendlar va talaba chegirmalari ({filteredBrands.length} ta natija)
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
        ) : filteredBrands.length === 0 ? (
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
            {filteredBrands.map((brand) => {
              const isLiked =
                likedIds.includes(String(brand.id)) ||
                offers.some(
                  (o) =>
                    String(o.brand_id) === String(brand.id) &&
                    likedIds.includes(String(o.id))
                );
              const brandOffers = offers.filter((o) => o.brand_id === brand.id);
              const mainTitle =
                brandOffers[0]?.title_uz ||
                brand.tagline?.uz ||
                `${brand.name} — talabalar uchun maxsus chegirma`;

              return (
                <Link
                  key={brand.id}
                  to={`/brand/${brand.id}?cat=${category}`}
                  onMouseEnter={() => api.prefetchBrand(brand.id)}
                  className="group flex flex-col overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/95 p-2.5 shadow-[0_18px_42px_-26px_rgba(0,45,150,0.3)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900/90"
                >
                  <div
                    className="relative flex h-40 w-full flex-col justify-between overflow-hidden rounded-[20px] p-4 text-white"
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
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover opacity-35 transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[76px] font-black text-white/15 select-none">
                      {brand.monogram || (brand.name || 'I')[0]}
                    </span>

                    <div className="relative z-10 flex items-start justify-between">
                      <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-white p-1 text-[13px] font-black text-[#08123A]">
                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          brand.monogram || (brand.name || 'I')[0]
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleToggleLike(e, brand.id)}
                        aria-label="Saqlash"
                        className="grid h-9 w-9 place-items-center rounded-full border border-white/80 bg-white/95 text-[#08123A] shadow-sm backdrop-blur-md transition-transform hover:scale-110"
                      >
                        <Heart
                          className={cn(
                            'h-4 w-4 transition-colors',
                            isLiked ? 'fill-rose-500 text-rose-500' : 'fill-transparent text-slate-700'
                          )}
                        />
                      </button>
                    </div>

                    <div className="relative z-10">
                      <span className="inline-block rounded-full bg-white px-3 py-1 text-[11.5px] font-black text-[#08123A]">
                        {brand.discount || '-20%'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between px-2 pb-2 pt-3">
                    <div>
                      <p className="text-[11.5px] font-bold text-slate-400">{brand.name}</p>
                      <h3 className="mt-0.5 line-clamp-2 text-[14.5px] font-extrabold leading-snug text-[#08123A] dark:text-slate-100">
                        {brand.discount} · {mainTitle}
                      </h3>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        {brand.redemption === 'app' ? (
                          <Smartphone className="h-3.5 w-3.5 text-[#1D6FF2] dark:text-sky-400" />
                        ) : (
                          <QrCode className="h-3.5 w-3.5 text-[#1D6FF2] dark:text-sky-400" />
                        )}
                        {brand.redemption === 'app' ? 'Ilova orqali' : 'QR-kod'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 font-extrabold text-amber-600 dark:text-amber-300">
                        <Flame className="h-3 w-3" />
                        {brand.activations_count || 240} aktivatsiya
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
