import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, QrCode, Smartphone, Trash2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import BrandForm from '@/components/admin/BrandForm';
import OfferForm from '@/components/admin/OfferForm';
import { useLang } from '@/lib/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/services/api';
import { localizedTitle } from '@/lib/deal';
import { cn } from '@/lib/utils';

export default function AdminDeals() {
  const { t, lang } = useLang();
  const { toast } = useToast();
  const [brands, setBrands] = useState([]);
  const [selected, setSelected] = useState(null);
  const [offers, setOffers] = useState([]);
  const [showBrandForm, setShowBrandForm] = useState(false);

  const loadBrands = () =>
    api.listBrands().then((list) => {
      setBrands(list);
      setSelected((prev) => prev || list[0]?.id || null);
    });

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    if (selected) api.listOffers(selected).then(setOffers);
  }, [selected]);

  const brand = brands.find((b) => b.id === selected);

  return (
    <AppShell>
      <div className="mb-4 flex gap-1.5 rounded-full border border-white/70 bg-white/60 p-1 backdrop-blur-xl">
        <Link
          to="/admin"
          className="flex-1 rounded-full py-2 text-center text-[12px] font-bold text-slate-500"
        >
          {t('deals.verification')}
        </Link>
        <Link
          to="/admin/deals"
          className="flex-1 rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] py-2 text-center text-[12px] font-bold text-white"
        >
          {t('deals.deals')}
        </Link>
      </div>

      <header className="mb-4">
        <h1 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-[#08123A]">
          {t('deals.title')}
        </h1>
        <p className="text-[12px] font-medium text-slate-500">{t('deals.subtitle')}</p>
      </header>

      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        1 · {t('deals.selectBrand')}
      </p>
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {brands.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setSelected(b.id)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-bold transition-colors',
              selected === b.id
                ? 'border-transparent bg-[#002D96] text-white'
                : 'border-white/70 bg-white/70 text-slate-600'
            )}
          >
            <span
              className="grid h-6 w-6 place-items-center rounded-lg text-[10px] text-white"
              style={{ background: `linear-gradient(135deg, ${b.accent}, ${b.accent2})` }}
            >
              {b.monogram}
            </span>
            {b.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowBrandForm((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-[#1D6FF2]/50 px-3 py-2 text-[12px] font-bold text-[#002D96]"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('deals.newBrand')}
        </button>
      </div>

      {showBrandForm && (
        <div className="mb-4">
          <BrandForm
            onSaved={(created) => {
              setShowBrandForm(false);
              loadBrands();
              setSelected(created.id);
              toast({ title: t('deals.brandCreated') });
            }}
          />
        </div>
      )}

      {brand && (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              2 · {t('deals.offerTitle')} — {brand.name}
            </p>
            {offers.length ? (
              <ul className="space-y-2">
                {offers.map((offer) => (
                  <li
                    key={offer.id}
                    className="rounded-[20px] border border-white/70 bg-white/75 p-3.5 backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-bold leading-snug text-[#08123A]">
                          {localizedTitle(offer, lang)}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[10.5px] font-semibold text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#002D96]/8 px-2 py-0.5 text-[#002D96]">
                            {offer.redemption === 'app' ? (
                              <Smartphone className="h-2.5 w-2.5" />
                            ) : (
                              <QrCode className="h-2.5 w-2.5" />
                            )}
                            {t(offer.redemption === 'app' ? 'offer.app' : 'offer.qr')}
                          </span>
                          {offer.promoCode && (
                            <span className="font-mono text-[10px] text-slate-400">{offer.promoCode}</span>
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await api.deleteOffer(offer.id);
                          if (ok) setOffers((list) => list.filter((o) => o.id !== offer.id));
                        }}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-500"
                        aria-label={t('deals.delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-[20px] border border-dashed border-white/80 bg-white/50 px-4 py-8 text-center text-[12px] font-semibold text-slate-500">
                {t('deals.noOffers')}
              </p>
            )}
          </div>

          <OfferForm
            brand={brand}
            onSaved={(created) => {
              setOffers((list) => [...list, created]);
              toast({ title: t('deals.offerCreated'), description: created.title_uz });
            }}
          />
        </div>
      )}
    </AppShell>
  );
}