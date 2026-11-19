import { QrCode, Smartphone } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { localizedTitle } from '@/lib/deal';

export default function OfferCard({ offer, onClaim }) {
  const { t, lang } = useLang();
  const isApp = offer.redemption === 'app';

  return (
    <div className="rounded-[22px] border border-white/70 bg-white/75 p-4 shadow-[0_16px_36px_-30px_rgba(0,45,150,0.75)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13.5px] font-extrabold leading-snug text-[#08123A]">
          {localizedTitle(offer, lang)}
        </p>
        <span className="shrink-0 rounded-full bg-[#002D96] px-2.5 py-1 text-[11px] font-bold text-white">
          {offer.discount}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#002D96]/8 px-2.5 py-1 text-[10px] font-semibold text-[#002D96]">
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