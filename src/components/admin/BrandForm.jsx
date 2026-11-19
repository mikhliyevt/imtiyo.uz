import { useEffect, useState } from 'react';
import {
  Check,
  Globe,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, DEFAULT_CATEGORIES } from '@/services/api';
import { cn } from '@/lib/utils';

export default function BrandForm({ initialBrand = null, onSaved, onCancel }) {
  const [categoriesList, setCategoriesList] = useState(DEFAULT_CATEGORIES);

  const [name, setName] = useState(initialBrand?.name || '');
  const [selectedCategories, setSelectedCategories] = useState(
    initialBrand?.categories?.length ? initialBrand.categories : ['food']
  );

  // Rasm joylari (Logo va Slayd rasmi)
  const [logoUrl, setLogoUrl] = useState(initialBrand?.logo_url || '');
  const [coverUrl, setCoverUrl] = useState(initialBrand?.cover_url || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Brend haqida info
  const [descriptionUz, setDescriptionUz] = useState(initialBrand?.description?.uz || '');

  // Ijtimoiy tarmoqlar (faqat kiritilganlari saytda ko'rinadi)
  const [website, setWebsite] = useState(initialBrand?.website || '');
  const [instagram, setInstagram] = useState(initialBrand?.instagram || '');
  const [facebook, setFacebook] = useState(initialBrand?.facebook || '');
  const [tiktok, setTiktok] = useState(initialBrand?.tiktok || '');
  const [linkedin, setLinkedin] = useState(initialBrand?.linkedin || '');

  // Xarita qo'shasizmi? (Ha / Yo'q) va Lokatsiyalar
  const [hasMap, setHasMap] = useState(
    initialBrand ? Boolean(initialBrand.has_map) : false
  );
  const [locations, setLocations] = useState([]);
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchLat, setBranchLat] = useState('41.311081');
  const [branchLng, setBranchLng] = useState('69.240562');
  const [searchingGeo, setSearchingGeo] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.listCategories().then((list) => {
      if (Array.isArray(list)) {
        setCategoriesList(list.filter((c) => c.id !== 'all'));
      }
    });
    if (initialBrand?.id) {
      api.listLocations(initialBrand.id).then((locs) => {
        if (Array.isArray(locs) && locs.length > 0) {
          setLocations(locs);
          setHasMap(Boolean(initialBrand.has_map));
        }
      });
    }
  }, [initialBrand]);

  const toggleCategory = (catId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId)
        ? prev.length > 1
          ? prev.filter((id) => id !== catId)
          : prev
        : [...prev, catId]
    );
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await api.uploadFile(file, 'logos', { maxWidth: 400, maxHeight: 400 });
      setLogoUrl(url);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await api.uploadFile(file, 'slides', { maxWidth: 1200, maxHeight: 720 });
      setCoverUrl(url);
    } finally {
      setUploadingCover(false);
    }
  };

  // Manzil yozilganda xaritadan koordinatasini avtomatik topish (OpenStreetMap Nominatim)
  const handleFindOnMap = async () => {
    if (!branchAddress.trim()) return;
    setSearchingGeo(true);
    try {
      const q = encodeURIComponent(`${branchAddress.trim()}, Uzbekistan`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`
      );
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        setBranchLat(String(data[0].lat));
        setBranchLng(String(data[0].lon));
      }
    } catch {
      /* ignore */
    } finally {
      setSearchingGeo(false);
    }
  };

  const handleAddBranchLocation = () => {
    if (!branchAddress.trim() && !branchName.trim()) return;
    const newLoc = {
      id: 'loc-' + Date.now(),
      name: branchName.trim() || `${name || 'Brend'} filiali`,
      address: branchAddress.trim() || 'Toshkent shahri',
      lat: Number(branchLat) || 41.311081,
      lng: Number(branchLng) || 69.240562,
    };
    setLocations((prev) => [...prev, newLoc]);
    setBranchName('');
    setBranchAddress('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const cleanSlug =
        (initialBrand?.id || name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'brand-' + Date.now();

      // Agar admin "Ha" deb manzil yozgan bo'lsa-yu, lekin "+" ni bosish esidan chiqqan bo'lsa, uni ham qo'shib ketamiz
      let finalLocations = [...locations];
      if (hasMap && finalLocations.length === 0 && (branchAddress.trim() || branchName.trim())) {
        finalLocations.push({
          id: 'loc-' + Date.now(),
          name: branchName.trim() || `${name.trim()} filiali`,
          address: branchAddress.trim() || 'Toshkent shahri',
          lat: Number(branchLat) || 41.311081,
          lng: Number(branchLng) || 69.240562,
        });
      }

      const payload = {
        slug: cleanSlug,
        name: name.trim(),
        category: selectedCategories[0] || 'food',
        categories: selectedCategories,
        logo_url: logoUrl.trim(),
        cover_url: coverUrl.trim(),
        description_uz: descriptionUz.trim(),
        website: website.trim(),
        instagram: instagram.trim(),
        facebook: facebook.trim(),
        tiktok: tiktok.trim(),
        linkedin: linkedin.trim(),
        has_map: hasMap,
        locations: hasMap ? finalLocations : [],
      };

      const saved = initialBrand
        ? await api.updateBrand(initialBrand.id, payload)
        : await api.createBrand(payload);

      if (saved && onSaved) onSaved(saved);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-[28px] border border-white/85 bg-white p-6 shadow-md"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-[17px] font-extrabold text-[#08123A]">
            {initialBrand ? `${initialBrand.name} — Tahrirlash` : 'Yangi hamkor brend qo‘shish'}
          </h3>
          <p className="text-[12px] text-slate-500">
            Brend nomi, logosi, slayd rasmi, ijtimoiy tarmoqlar va xarita joylashuvini kiriting
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[12px] font-bold text-slate-400 hover:text-slate-600"
          >
            Bekor qilish
          </button>
        )}
      </div>

      {/* 1. BREND NOMI */}
      <div>
        <label className="mb-1 block text-[11.5px] font-bold text-slate-600">
          Brend nomi *
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Masalan: Żabka, EVOS yoki Cambridge"
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13.5px] font-bold text-[#08123A] outline-none focus:border-[#1D6FF2]"
        />
      </div>

      {/* 2. BREND LOGOSI VA SLAYD RASMI */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 md:col-span-5">
          <label className="mb-2 block text-[11.5px] font-extrabold text-[#08123A]">
            1. Brend logosi (Oq kvadratda chiqadi)
          </label>
          <div className="flex items-center gap-3">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xs">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <ImageIcon className="h-7 w-7 text-slate-300" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#002D96] px-3 py-2 text-[12px] font-bold text-white hover:bg-[#1D6FF2]">
                {uploadingLogo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>Logo yuklash</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Yoki Logo URL..."
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 md:col-span-7">
          <label className="mb-2 block text-[11.5px] font-extrabold text-[#08123A]">
            2. Slayd va muqova rasmi (Avtomatik moslanadi)
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:w-40">
              {coverUrl ? (
                <img src={coverUrl} alt="Slide" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-slate-400">
                  Slayd rasmi
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#002D96] to-[#1D6FF2] px-4 py-2 text-[12px] font-bold text-white">
                {uploadingCover ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>Slayd uchun rasm yuklash</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </label>
              <input
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="Yoki rasm URL manzilini kiriting..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-semibold outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. KOMPANIYA HAQIDA QISQA MA'LUMOT */}
      <div>
        <label className="mb-1 block text-[11.5px] font-bold text-slate-600">
          Kompaniya / Brend haqida qisqa ma’lumot (Brend sahifasida chiqadi) *
        </label>
        <textarea
          required
          rows={3}
          value={descriptionUz}
          onChange={(e) => setDescriptionUz(e.target.value)}
          placeholder="Kompaniya faoliyati va talabalar uchun qanday imkoniyatlar berishi haqida qisqacha yozing..."
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-[12.5px] font-medium outline-none focus:border-[#1D6FF2]"
        />
      </div>

      {/* 4. KOMPANIYA VEB-SAYTI VA IJTIMOIY TARMOQLARI (FAQAT YOZILGANLARI SAYTDA CHIQADI) */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
        <label className="mb-1 flex items-center gap-1.5 text-[12px] font-extrabold text-[#08123A]">
          <Globe className="h-4 w-4 text-[#1D6FF2]" />
          Kompaniya veb-sayti va ijtimoiy tarmoqlari
        </label>
        <p className="mb-2.5 text-[11px] text-slate-500">
          Faqat siz to‘ldirgan tarmoqlar saytda ko‘rinadi (bo‘sh qoldirilganlari saytda chiqmaydi)
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="Veb-sayt (https://...)"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold outline-none focus:border-[#1D6FF2]"
          />
          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="Instagram link"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold outline-none focus:border-[#1D6FF2]"
          />
          <input
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder="Facebook link"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold outline-none focus:border-[#1D6FF2]"
          />
          <input
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            placeholder="TikTok link"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold outline-none focus:border-[#1D6FF2]"
          />
          <input
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="LinkedIn / Telegram link"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold outline-none focus:border-[#1D6FF2]"
          />
        </div>
      </div>

      {/* 5. XARITA (LOKATSIYA) QO'SHASIZMI? (HA / YO'Q) */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[13px] font-extrabold text-[#08123A]">
              <MapPin className="h-4 w-4 text-[#1D6FF2]" />
              Ushbu brend va uning chegirmalari uchun xarita (Map) qo‘shasizmi?
            </p>
            <p className="text-[11.5px] text-slate-500">
              «Yo‘q» desangiz, saytda chegirma ichida xarita ko‘rinmaydi
            </p>
          </div>

          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setHasMap(true)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-[12px] font-extrabold transition-all',
                hasMap
                  ? 'bg-[#002D96] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-[#08123A]'
              )}
            >
              Ha, xarita qo‘shish
            </button>
            <button
              type="button"
              onClick={() => setHasMap(false)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-[12px] font-extrabold transition-all',
                !hasMap
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-[#08123A]'
              )}
            >
              Yo‘q (Xaritasiz)
            </button>
          </div>
        </div>

        {hasMap && (
          <div className="mt-4 space-y-3 border-t border-slate-200/70 pt-4">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
              <input
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="Filial nomi (masalan: Chilonzor filiali)"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold outline-none sm:col-span-4"
              />
              <div className="flex gap-1.5 sm:col-span-5">
                <input
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="Manzilni yozing (masalan: Amir Temur 15)"
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold outline-none"
                />
                <button
                  type="button"
                  onClick={handleFindOnMap}
                  disabled={searchingGeo}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-slate-200/80 px-3 py-2 text-[11.5px] font-bold text-[#08123A] hover:bg-slate-300"
                >
                  {searchingGeo ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Search className="h-3.5 w-3.5" />
                  )}
                  <span>Topish</span>
                </button>
              </div>
              <button
                type="button"
                onClick={handleAddBranchLocation}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#002D96] px-3 py-2 text-[12px] font-bold text-white hover:bg-[#1D6FF2] sm:col-span-3"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ro‘yxatga qo‘shish</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400">Kenglik (Lat)</label>
                <input
                  value={branchLat}
                  onChange={(e) => setBranchLat(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11.5px] font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400">Uzunlik (Lng)</label>
                <input
                  value={branchLng}
                  onChange={(e) => setBranchLng(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11.5px] font-mono"
                />
              </div>
            </div>

            {/* Xaritadan jonli ko'rish */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <iframe
                key={`${branchLat}-${branchLng}`}
                title="Branch Map Preview"
                src={`https://maps.google.com/maps?q=${branchLat || 41.311081},${
                  branchLng || 69.240562
                }&z=15&output=embed`}
                className="h-44 w-full border-0"
                loading="lazy"
              />
            </div>

            {locations.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-extrabold text-[#08123A]">
                  Qo‘shilgan filiallar ({locations.length}):
                </p>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {locations.map((loc) => (
                    <li
                      key={loc.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-[#08123A]">{loc.name}</p>
                        <p className="truncate text-[11px] text-slate-500">{loc.address}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setLocations((prev) => prev.filter((item) => item.id !== loc.id))
                        }
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. FAQAT KATEGORIYALAR ("Qaysi bo'limlarda ko'rinsin?" olib tashlandi) */}
      <div>
        <label className="mb-2 block text-[12px] font-extrabold text-[#08123A]">
          Kategoriyalarni tanlang *
        </label>
        <div className="flex flex-wrap gap-2">
          {categoriesList.map((cat) => {
            const active = selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-bold transition-all',
                  active
                    ? 'border-[#002D96] bg-[#002D96] text-white shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                )}
              >
                {active && <Check className="h-3.5 w-3.5" />}
                <span>{cat.label_uz}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Button
        type="submit"
        disabled={saving}
        className="h-11 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-extrabold text-white shadow-md"
      >
        <Plus className="mr-1.5 h-4 w-4" />
        {saving
          ? 'Saqlanmoqda...'
          : initialBrand
            ? 'Brend o‘zgarishlarini saqlash'
            : 'Brendni yaratish va chegirmalar qo‘shishga o‘tish'}
      </Button>
    </form>
  );
}