import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useLang } from '@/lib/LanguageContext';
import { api } from '@/services/api';
import {
  TASHKENT_CENTER,
  brands as sampleBrands,
  locations as sampleLocations,
} from '@/data/mockData';
import { distanceKm } from '@/lib/deal';
import { cn } from '@/lib/utils';

const pinIcon = (brand, isHighlighted = false) =>
  L.divIcon({
    className: 'imtiyo-pin',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:${isHighlighted ? 42 : 38}px;height:${isHighlighted ? 42 : 38}px;border-radius:14px;background:linear-gradient(135deg,${brand.accent || '#002D96'},${brand.accent2 || '#1D6FF2'});box-shadow:0 10px 22px -8px rgba(0,45,150,0.75);border:2.5px solid rgba(255,255,255,0.98);color:#fff;font-weight:800;font-size:14px;font-family:inherit;">${brand.monogram || (brand.name || 'I').slice(0, 1)}</div>`,
    iconSize: [isHighlighted ? 42 : 38, isHighlighted ? 42 : 38],
    iconAnchor: [isHighlighted ? 21 : 19, isHighlighted ? 21 : 19],
  });

const userLocationIcon = L.divIcon({
  className: 'imtiyo-user-pin',
  html: `<div style="position:relative;width:22px;height:22px;display:flex;align-items:center;justify-content:center;">
    <span style="position:absolute;inset:-6px;border-radius:9999px;background:rgba(29,111,242,0.28);animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>
    <span style="position:relative;width:16px;height:16px;border-radius:9999px;background:#1D6FF2;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(0,45,150,0.55);"></span>
  </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function formatDistanceLabel(kmVal) {
  const num = Number(kmVal);
  if (!Number.isFinite(num)) return '';
  if (num < 1) return `${Math.max(50, Math.round(num * 1000))} m`;
  return `${num.toFixed(1)} km`;
}

function MapFocus({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], target.zoom || 13, { duration: 1.1 });
    }
  }, [target, map]);
  return null;
}

export default function MapPage() {
  const { t } = useLang();
  const [locations, setLocations] = useState(sampleLocations);
  const [brands, setBrands] = useState(sampleBrands);
  const [selected, setSelected] = useState(null);
  const [focus, setFocus] = useState({ ...TASHKENT_CENTER, zoom: 11 });
  const [userPos, setUserPos] = useState(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.listLocations(), api.listBrands()]).then(([locs, brs]) => {
      if (!active) return;
      if (Array.isArray(locs) && locs.length) setLocations(locs);
      if (Array.isArray(brs) && brs.length) setBrands(brs);
    });
    return () => {
      active = false;
    };
  }, []);

  const brandById = useMemo(() => Object.fromEntries(brands.map((b) => [b.id, b])), [brands]);

  const referencePoint = userPos || TASHKENT_CENTER;

  const enriched = useMemo(() => {
    return locations
      .map((loc) => ({
        ...loc,
        brand: brandById[loc.brand_id],
        distance: distanceKm(referencePoint, loc),
      }))
      .filter((loc) => Boolean(loc.brand))
      .sort((a, b) => a.distance - b.distance);
  }, [locations, brandById, referencePoint]);

  const nearbyCount = useMemo(() => {
    if (!userPos) return enriched.length;
    return enriched.filter((loc) => loc.distance <= 15).length;
  }, [enriched, userPos]);

  const handleLocateMe = useCallback(() => {
    setGeoError('');
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError(t('map.geoUnsupported'));
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserPos(coords);
        setSelected(null);
        setFocus({ lat: coords.lat, lng: coords.lng, zoom: 13 });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err && err.code === 1) {
          setGeoError(t('map.geoDenied'));
        } else {
          setGeoError(t('map.geoError'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      }
    );
  }, [t]);

  return (
    <AppShell breadcrumbs={[{ label: t('nav.mapFull') }]}>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold leading-tight tracking-[-0.02em] text-[#08123A] dark:text-white">
            {t('map.title')}
          </h1>
          <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">
            {userPos ? t('map.nearestSubtitle') : t('map.subtitle')}
          </p>
        </div>

        {/* JOYLASHUVIMNI ANIQLASH TUGMASI (PC va Mobile uchun!) */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className={cn(
            'inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-[13px] font-extrabold shadow-md transition-all',
            userPos
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/35 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'bg-gradient-to-r from-[#002D96] via-[#1D6FF2] to-[#00A9FF] text-white hover:brightness-105'
          )}
        >
          {locating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('map.locating')}</span>
            </>
          ) : userPos ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>{t('map.located')}</span>
            </>
          ) : (
            <>
              <LocateFixed className="h-4 w-4" />
              <span>{t('map.locateMe')}</span>
            </>
          )}
        </button>
      </header>

      {geoError && (
        <div className="mb-3.5 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[12.5px] font-semibold text-rose-700 dark:border-rose-500/35 dark:bg-rose-950/45 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {userPos && (
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#1D6FF2]/25 bg-[#1D6FF2]/[0.06] px-4 py-2.5 text-[12.5px] font-bold text-[#002D96] dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
          <span className="flex items-center gap-2">
            <Navigation className="h-4 w-4 shrink-0" />
            {nearbyCount > 0
              ? t('map.nearbyFound', { n: nearbyCount })
              : t('map.sortedByDistance')}
          </span>
          <button
            type="button"
            onClick={() => setFocus({ lat: userPos.lat, lng: userPos.lng, zoom: 13 })}
            className="text-[11.5px] font-extrabold underline"
          >
            {t('map.yourLocation')}
          </button>
        </div>
      )}

      <div className="relative overflow-hidden rounded-[26px] border border-slate-200/80 shadow-[0_26px_60px_-34px_rgba(0,45,150,0.45)] dark:border-slate-800">
        <MapContainer
          center={TASHKENT_CENTER}
          zoom={11}
          scrollWheelZoom
          className="h-[60vh] w-full md:h-[520px]"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapFocus target={focus} />

          {/* Foydalanuvchining haqiqiy GPS nuqtasi */}
          {userPos && (
            <>
              <Circle
                center={[userPos.lat, userPos.lng]}
                radius={2500}
                pathOptions={{
                  color: '#1D6FF2',
                  fillColor: '#1D6FF2',
                  fillOpacity: 0.08,
                  weight: 1.5,
                }}
              />
              <Marker position={[userPos.lat, userPos.lng]} icon={userLocationIcon}>
                <Popup>
                  <p className="text-[12px] font-extrabold text-[#002D96]">
                    {t('map.yourLocation')}
                  </p>
                </Popup>
              </Marker>
            </>
          )}

          {enriched.map((loc) => (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={pinIcon(loc.brand, selected?.id === loc.id)}
              eventHandlers={{ click: () => setSelected(loc) }}
            >
              <Popup>
                <div className="min-w-[155px]">
                  <p className="text-[12.5px] font-extrabold text-[#08123A]">
                    {loc.brand.name}
                  </p>
                  <p className="text-[11px] text-slate-500">{loc.address}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#1D6FF2]">
                      {loc.brand.discount}
                    </span>
                    <span className="text-[10.5px] font-semibold text-slate-500">
                      {formatDistanceLabel(loc.distance)}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Xarita burchagidagi tezkor joylashuv tugmasi */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          title={t('map.locateMe')}
          aria-label={t('map.locateMe')}
          className="absolute right-3 top-3 z-[500] grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white/95 text-[#002D96] shadow-lg backdrop-blur-md transition-transform hover:scale-105 dark:border-slate-700 dark:bg-slate-900/95 dark:text-sky-400"
        >
          {locating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LocateFixed className="h-4 w-4" />
          )}
        </button>

        {selected && (
          <div className="absolute inset-x-3 bottom-3 z-[500] rounded-[22px] border border-white/80 bg-white/95 p-3.5 shadow-[0_20px_44px_-20px_rgba(0,45,150,0.65)] backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/95">
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
                  <p className="truncate text-[13px] font-extrabold text-[#08123A] dark:text-white">
                    {selected.brand.name}
                  </p>
                  <span className="shrink-0 rounded-full bg-[#002D96]/10 px-2 py-0.5 text-[10px] font-bold text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300">
                    {selected.brand.discount}
                  </span>
                </div>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {selected.address}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#1D6FF2] dark:text-sky-400">
                  <Navigation className="h-3 w-3" />
                  {formatDistanceLabel(selected.distance)}
                  {selected.city ? ` · ${selected.city}` : ''}
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

      <section className="mt-6 pb-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-[13px] font-extrabold uppercase tracking-wide text-[#08123A] dark:text-slate-200">
            {userPos ? t('map.nearestList') : t('map.locations')} ({enriched.length})
          </h2>
        </div>
        <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {enriched.map((loc) => (
            <li key={loc.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(loc);
                  setFocus({ lat: loc.lat, lng: loc.lng, zoom: 14 });
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[20px] border bg-white/90 px-3.5 py-3 text-left backdrop-blur-xl transition-colors dark:bg-slate-900/85',
                  selected?.id === loc.id
                    ? 'border-[#1D6FF2] bg-white shadow-sm dark:border-sky-400 dark:bg-slate-900'
                    : 'border-slate-200/80 hover:border-[#1D6FF2]/50 hover:bg-white dark:border-slate-800 dark:hover:border-sky-400/50 dark:hover:bg-slate-900'
                )}
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
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[12.5px] font-bold text-[#08123A] dark:text-white">
                      {loc.name || loc.brand.name}
                    </span>
                    <span className="shrink-0 rounded-full bg-[#002D96]/10 px-2 py-0.5 text-[10px] font-extrabold text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300">
                      {loc.brand.discount}
                    </span>
                  </span>
                  <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {loc.address}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] font-bold text-[#1D6FF2] dark:text-sky-400">
                  {formatDistanceLabel(loc.distance)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
