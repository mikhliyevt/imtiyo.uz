import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowRight, MapPin, Navigation } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useLang } from '@/lib/LanguageContext';
import { api } from '@/services/api';
import { TASHKENT_CENTER, brands as sampleBrands, locations as sampleLocations } from '@/data/mockData';
import { distanceKm } from '@/lib/deal';

const CITIES = [
  { name: 'Toshkent', lat: 41.2995, lng: 69.2401, zoom: 11 },
  { name: 'Samarqand', lat: 39.6542, lng: 66.9597, zoom: 12 },
  { name: 'Buxoro', lat: 39.7747, lng: 64.4286, zoom: 12 },
];

const pinIcon = (brand) =>
  L.divIcon({
    className: 'imtiyo-pin',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:14px;background:linear-gradient(135deg,${brand.accent},${brand.accent2});box-shadow:0 10px 22px -8px rgba(0,45,150,0.75);border:2px solid rgba(255,255,255,0.95);color:#fff;font-weight:800;font-size:14px;font-family:inherit;">${brand.monogram || brand.name.slice(0, 1)}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });

function MapFocus({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], target.zoom || 13, { duration: 1.2 });
  }, [target, map]);
  return null;
}

export default function MapPage() {
  const { t } = useLang();
  const [locations, setLocations] = useState(sampleLocations);
  const [brands, setBrands] = useState(sampleBrands);
  const [selected, setSelected] = useState(null);
  const [focus, setFocus] = useState({ ...TASHKENT_CENTER, zoom: 11 });

  useEffect(() => {
    api.listLocations().then(setLocations);
    api.listBrands().then(setBrands);
  }, []);

  const brandById = useMemo(() => Object.fromEntries(brands.map((b) => [b.id, b])), [brands]);

  const enriched = locations
    .map((loc) => ({
      ...loc,
      brand: brandById[loc.brand_id],
      distance: distanceKm(TASHKENT_CENTER, loc),
    }))
    .sort((a, b) => a.distance - b.distance);

  return (
    <AppShell>
      <header className="mb-4">
        <h1 className="text-[24px] font-extrabold leading-tight tracking-[-0.02em] text-[#08123A]">
          {t('map.title')}
        </h1>
        <p className="mt-1 text-[13px] font-medium text-slate-500">{t('map.subtitle')}</p>
      </header>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CITIES.map((city) => (
          <button
            key={city.name}
            type="button"
            onClick={() => {
              setFocus({ lat: city.lat, lng: city.lng, zoom: city.zoom });
              setSelected(null);
            }}
            className="shrink-0 rounded-full border border-white/70 bg-white/70 px-3.5 py-1.5 text-[12px] font-semibold text-[#002D96] backdrop-blur-xl"
          >
            {city.name}
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-[26px] border border-white/70 shadow-[0_26px_60px_-34px_rgba(0,45,150,0.7)]">
        <MapContainer
          center={TASHKENT_CENTER}
          zoom={11}
          scrollWheelZoom
          className="h-[62vh] w-full md:h-[520px]"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapFocus target={focus} />
          {enriched.map((loc) =>
            loc.brand ? (
              <Marker
                key={loc.id}
                position={[loc.lat, loc.lng]}
                icon={pinIcon(loc.brand)}
                eventHandlers={{ click: () => setSelected(loc) }}
              >
                <Popup>
                  <div className="min-w-[150px]">
                    <p className="text-[12px] font-extrabold text-[#08123A]">{loc.brand.name}</p>
                    <p className="text-[11px] text-slate-500">{loc.address}</p>
                    <p className="mt-1 text-[11px] font-bold text-[#1D6FF2]">{loc.brand.discount}</p>
                  </div>
                </Popup>
              </Marker>
            ) : null
          )}
        </MapContainer>

        {selected && (
          <div className="absolute inset-x-3 bottom-3 z-[500] rounded-[22px] border border-white/70 bg-white/85 p-3.5 shadow-[0_20px_44px_-20px_rgba(0,45,150,0.75)] backdrop-blur-2xl">
            <div className="flex items-start gap-3">
              <div
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-[15px] font-extrabold text-white"
                style={{
                  background: `linear-gradient(135deg, ${selected.brand.accent}, ${selected.brand.accent2})`,
                }}
              >
                {selected.brand.monogram}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[13px] font-extrabold text-[#08123A]">
                    {selected.brand.name}
                  </p>
                  <span className="shrink-0 rounded-full bg-[#002D96]/10 px-2 py-0.5 text-[10px] font-bold text-[#002D96]">
                    {selected.brand.discount}
                  </span>
                </div>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {selected.address}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#1D6FF2]">
                  <Navigation className="h-3 w-3" />
                  {selected.distance} km · {selected.city}
                </p>
              </div>
            </div>
            <Link
              to={`/brand/${selected.brand.id}`}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] py-2.5 text-[12px] font-bold text-white"
            >
              {t('common.viewDeal')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

      <section className="mt-5">
        <h2 className="mb-2 text-[13px] font-extrabold uppercase tracking-wide text-[#08123A]">
          {t('map.locations')}
        </h2>
        <ul className="space-y-2">
          {enriched.map((loc) =>
            loc.brand ? (
              <li key={loc.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(loc);
                    setFocus({ lat: loc.lat, lng: loc.lng, zoom: 14 });
                  }}
                  className="flex w-full items-center gap-3 rounded-[20px] border border-white/70 bg-white/65 px-3.5 py-3 text-left backdrop-blur-xl transition-colors hover:bg-white/85"
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[13px] font-extrabold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${loc.brand.accent}, ${loc.brand.accent2})`,
                    }}
                  >
                    {loc.brand.monogram}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-bold text-[#08123A]">
                      {loc.name}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">{loc.address}</span>
                  </span>
                  <span className="shrink-0 text-[11px] font-bold text-[#1D6FF2]">
                    {loc.distance} km
                  </span>
                </button>
              </li>
            ) : null
          )}
        </ul>
      </section>
    </AppShell>
  );
}