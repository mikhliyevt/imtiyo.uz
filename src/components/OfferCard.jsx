import { useEffect, useState } from 'react';
import { Heart, QrCode, Smartphone } from 'lucide-react';
import { openAuthPromptModal } from '@/components/AppShell';
import { useLang } from '@/lib/LanguageContext';
import { useStudent } from '@/lib/StudentContext';
import { api } from '@/services/api';
import { localizedTitle } from '@/lib/deal';
import { cn } from '@/lib/utils';

export default function OfferCard({ offer, onClaim }) {
  const { t, lang } = useLang();
  const { profile } = useStudent();
  const isApp = offer.redemption === 'app';
  const [liked, setLiked] = useState(() => api.isOfferLiked(offer.id));

  useEffect(() => {
    const sync = () => setLiked(api.isOfferLiked(offer.id));
    window.addEventListener('imtiyo_likes_changed', sync);
    return () => window.removeEventListener('imtiyo_likes_changed', sync);
  }, [offer.id]);

  const handleToggleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profile?.signedIn) {
      openAuthPromptModal('like');
      return;
    }
    api.toggleOfferLike(offer.id);
  };

  return (
    <div className="rounded-[22px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_16px_36px_-30px_rgba(0,45,150,0.75)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13.5px] font-extrabold leading-snug text-[#08123A] dark:text-white">
          {localizedTitle(offer, lang)}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-full bg-[#002D96] px-2.5 py-1 text-[11px] font-bold text-white">
            {offer.discount}
          </span>
          <button
            type="button"
            onClick={handleToggleLike}
            aria-label="Chegirmani saqlash"
            className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-[#08123A] shadow-sm transition-transform hover:scale-110 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-colors',
                liked ? 'fill-rose-500 text-rose-500' : 'fill-transparent text-slate-500 dark:text-slate-300'
              )}
            />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#002D96]/8 px-2.5 py-1 text-[10px] font-semibold text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300">
          {isApp ? <Smartphone className="h-3 w-3" /> : <QrCode className="h-3 w-3" />}
          {t(isApp ? 'offer.app' : 'offer.qr')}
        </span>
        <button
          type="button"
          onClick={() => onClaim(offer)}
          className="rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] px-4 py-2 text-[11.5px] font-bold text-white shadow-[0_10px_22px_-12px_rgba(0,45,150,0.95)] transition-transform hover:scale-[1.02]"
        >
          {t('common.getDiscount')}
        </button>
      </div>
    </div>
  );
}