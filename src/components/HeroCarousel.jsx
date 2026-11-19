import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

export default function HeroCarousel({ items }) {
  const { lang } = useLang();
  const trackRef = useRef(null);

  if (!items.length) return null;

  const scrollByCards = (dir) => {
    if (!trackRef.current) return;
    const step = Math.min(440, trackRef.current.clientWidth * 0.8);
    trackRef.current.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <div className="group relative">
      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            aria-label="Oldingi"
            className="absolute -left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#002D96] text-white shadow-lg transition-transform hover:scale-105 md:grid"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            aria-label="Keyingi"
            className="absolute -right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#002D96] text-white shadow-lg transition-transform hover:scale-105 md:grid"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <div
        ref={trackRef}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0"
      >
        {items.map((item) => {
          const activations = item.activations_count || 0;
          const subtitle =
            item.tagline?.[lang] || item.tagline?.uz || `${item.discount} talabalar uchun`;
          return (
            <Link
              key={item.id}
              to={`/brand/${item.id}`}
              className="relative h-[200px] w-[86%] shrink-0 snap-start overflow-hidden rounded-[24px] border border-white/70 shadow-[0_20px_45px_-26px_rgba(0,45,150,0.65)] transition-transform duration-300 hover:-translate-y-0.5 sm:w-[64%] md:h-[220px] md:w-[46%]"
              style={{ background: `linear-gradient(125deg, ${item.accent2}, ${item.accent})` }}
            >
              {item.cover_url && (
                <img
                  src={item.cover_url}
                  alt={item.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#06123A]/90 via-[#06123A]/35 to-black/10" />

              {/* Yuqori qator: Brend logotipi + Aktivatsiyalar soni */}
              <div className="relative flex items-start justify-between p-4">
                <div className="grid h-13 w-13 place-items-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-md">
                  {item.logo_url ? (
                    <img
                      src={item.logo_url}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span
                      className="text-lg font-extrabold"
                      style={{ color: item.accent2 || '#002D96' }}
                    >
                      {item.monogram}
                    </span>
                  )}
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold text-[#08123A] shadow-sm backdrop-blur">
                  <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                  {activations.toLocaleString()} aktivatsiya
                </span>
              </div>

              {/* Pastki qator: Brend nomi, chegirma matni va holat */}
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <p className="text-[11.5px] font-semibold text-white/80">{item.name}</p>
                <h3 className="mt-0.5 line-clamp-2 text-[17px] font-extrabold leading-snug">
                  {item.discount} — {subtitle}
                </h3>
                <p className="mt-1 text-[11px] font-medium text-white/75">
                  {item.redemption === 'app' ? 'Ilova orqali' : 'QR-kod orqali'} · Talabalar uchun
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}