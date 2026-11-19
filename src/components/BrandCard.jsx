import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Heart, QrCode, Smartphone } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { openAuthPromptModal } from '@/components/AppShell';
import CardImageBlur from '@/components/CardImageBlur';
import { useStudent } from '@/lib/StudentContext';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

const categoryKey = {
  food: 'cat.food',
  grooming: 'cat.grooming',
  tech: 'cat.tech',
  fitness: 'cat.fitness',
  coffee: 'cat.coffee',
  education: 'cat.education',
};

export default function BrandCard({ brand, offer, t, lang = 'uz', className }) {
  const { profile } = useStudent();
  const [liked, setLiked] = useState(() =>
    offer ? api.isOfferLiked(offer.id) : api.isBrandLiked(brand.id)
  );

  useEffect(() => {
    const sync = () =>
      setLiked(offer ? api.isOfferLiked(offer.id) : api.isBrandLiked(brand.id));
    window.addEventListener('imtiyo_likes_changed', sync);
    return () => window.removeEventListener('imtiyo_likes_changed', sync);
  }, [offer, brand.id]);

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profile?.signedIn) {
      openAuthPromptModal('like');
      return;
    }
    if (offer) {
      api.toggleOfferLike(offer.id);
    } else {
      api.toggleBrandLike(brand.id);
    }
  };

  const isApp = (offer?.redemption || brand.redemption) === 'app';
  const badgeText = offer?.discount || brand.discount;
  const headline = offer
    ? offer.title?.[lang] || offer.title?.uz || brand.name
    : `${brand.discount} · ${brand.tagline?.[lang] || brand.tagline?.uz || brand.name}`;
  const activations =
    typeof offer?.activations_count === 'number'
      ? offer.activations_count
      : brand.activations_count || 0;

  return (
    <Link
      to={`/brand/${brand.id}`}
      onMouseEnter={() => api.prefetchBrand(brand.id)}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/90 shadow-[0_14px_34px_-22px_rgba(0,45,150,0.45)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-22px_rgba(0,45,150,0.5)] dark:border-slate-800 dark:bg-slate-900/90',
        className
      )}
    >
      {/* Yuqori rasm / fon + Brend logotipi + Yurakcha */}
      <div className="relative h-28 w-full overflow-hidden">
        {brand.cover_url ? (
          <Image
            src={brand.cover_url}
            alt={brand.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${brand.accent}, ${brand.accent2})`,
            }}
          >
            <span className="text-4xl font-extrabold text-white/30">{brand.monogram}</span>
          </div>
        )}
        <CardImageBlur direction="bottom" />

        {/* Brend logotipi (oq kvadrat ichida) */}
        <div className="absolute left-3 top-3 grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-white p-1.5 shadow-md">
          {brand.logo_url ? (
            <img src={brand.logo_url} alt={brand.name} className="h-full w-full object-contain" />
          ) : (
            <span
              className="text-[15px] font-extrabold"
              style={{ color: brand.accent2 || '#002D96' }}
            >
              {brand.monogram}
            </span>
          )}
        </div>

        {/* Yurakcha (Liked) tugmasi */}
        <button
          type="button"
          onClick={handleLike}
          aria-label="Yoqtirish"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-slate-500 shadow-sm backdrop-blur transition-transform hover:scale-110"
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-colors',
              liked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
            )}
          />
        </button>

        {/* Chegirma yorlig'i */}
        <span className="absolute bottom-2.5 left-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#002D96] shadow-xs">
          {badgeText}
        </span>
      </div>

      {/* Kontent */}
      <div className="flex flex-1 flex-col p-3.5">
        <p className="truncate text-[11px] font-semibold text-slate-400">{brand.name}</p>
        <p className="mt-0.5 line-clamp-2 text-[13.5px] font-extrabold leading-snug text-[#08123A] dark:text-slate-100">
          {headline}
        </p>

        <div className="mt-2 flex items-center gap-1.5 text-[10.5px] font-medium text-slate-400">
          {isApp ? <Smartphone className="h-3 w-3" /> : <QrCode className="h-3 w-3" />}
          <span>{t(isApp ? 'brand.redeemApp' : 'brand.redeemQr')}</span>
          <span>·</span>
          <span>{t(categoryKey[brand.category] || 'cat.food')}</span>
        </div>

        {/* Aktivatsiyalar soni */}
        <div className="mt-3 pt-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[10.5px] font-bold text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
            <Flame className="h-3 w-3 fill-orange-500 text-orange-500" />
            {activations.toLocaleString()} aktivatsiya
          </span>
        </div>
      </div>
    </Link>
  );
}