import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { Image } from '@/components/ui/image';

export default function DiscoverMore({ brands }) {
  const { t } = useLang();
  if (!brands.length) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-[13px] font-extrabold uppercase tracking-wide text-[#08123A]">
        {t('offer.discover')}
      </h2>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            to={`/brand/${brand.id}`}
            className="w-[148px] shrink-0 overflow-hidden rounded-[20px] border border-white/70 bg-white/75 backdrop-blur-xl"
          >
            <div className="relative h-20 w-full">
              {brand.cover_url ? (
                <Image src={brand.cover_url} alt={brand.name} className="h-full w-full" />
              ) : (
                <div
                  className="flex h-full items-center justify-center text-xl font-extrabold text-white"
                  style={{ background: `linear-gradient(135deg, ${brand.accent}, ${brand.accent2})` }}
                >
                  {brand.monogram}
                </div>
              )}
              <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9.5px] font-bold text-[#002D96]">
                {brand.discount}
              </span>
            </div>
            <p className="truncate px-3 py-2 text-[11.5px] font-bold text-[#08123A]">{brand.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}