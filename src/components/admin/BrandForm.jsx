import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Globe,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { api, DEFAULT_CATEGORIES } from '@/services/api';
import { cn } from '@/lib/utils';

export default function BrandForm({
  initialBrand = null,
  onSaved,
  onCancel,
  onDirtyChange,
}) {
  const { toast } = useToast();
  const [categoriesList, setCategoriesList] = useState(DEFAULT_CATEGORIES);

  const [name, setName] = useState(initialBrand?.name || '');
  const [selectedCategories, setSelectedCategories] = useState(
    initialBrand?.categories?.length ? initialBrand.categories : ['food']
  );

  const [logoUrl, setLogoUrl] = useState(initialBrand?.logo_url || '');
  const [coverUrl, setCoverUrl] = useState(initialBrand?.cover_url || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [descriptionUz, setDescriptionUz] = useState(initialBrand?.description?.uz || '');

  const [website, setWebsite] = useState(initialBrand?.website || '');
  const [instagram, setInstagram] = useState(initialBrand?.instagram || '');
  const [facebook, setFacebook] = useState(initialBrand?.facebook || '');
  const [tiktok, setTiktok] = useState(initialBrand?.tiktok || '');
  const [linkedin, setLinkedin] = useState(initialBrand?.linkedin || '');

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

  const initialSnapshotRef = useRef(
    JSON.stringify({
      name: initialBrand?.name || '',
      selectedCategories: initialBrand?.categories?.length ? initialBrand.categories : ['food'],
      logoUrl: initialBrand?.logo_url || '',
      coverUrl: initialBrand?.cover_url || '',
      descriptionUz: initialBrand?.description?.uz || '',
      website: initialBrand?.website || '',
      instagram: initialBrand?.instagram || '',
      facebook: initialBrand?.facebook || '',
      tiktok: initialBrand?.tiktok || '',
      linkedin: initialBrand?.linkedin || '',
      hasMap: initialBrand ? Boolean(initialBrand.has_map) : false,
      locations: [],
    })
  );

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
          const resolvedHasMap = Boolean(initialBrand.has_map);
          setHasMap(resolvedHasMap);
          initialSnapshotRef.current = JSON.stringify({
            name: initialBrand?.name || '',
            selectedCategories: initialBrand?.categories?.length
              ? initialBrand.categories
              : ['food'],
            logoUrl: initialBrand?.logo_url || '',
            coverUrl: initialBrand?.cover_url || '',
            descriptionUz: initialBrand?.description?.uz || '',
            website: initialBrand?.website || '',
            instagram: initialBrand?.instagram || '',
            facebook: initialBrand?.facebook || '',
            tiktok: initialBrand?.tiktok || '',
            linkedin: initialBrand?.linkedin || '',
            hasMap: resolvedHasMap,
            locations: locs,
          });
        }
      });
    }
  }, [initialBrand]);

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        name,
        selectedCategories,
        logoUrl,
        coverUrl,
        descriptionUz,
        website,
        instagram,
        facebook,
        tiktok,
        linkedin,
        hasMap,
        locations,
      }),
    [
      name,
      selectedCategories,
      logoUrl,
      coverUrl,
      descriptionUz,
      website,
      instagram,
      facebook,
      tiktok,
      linkedin,
      hasMap,
      locations,
    ]
  );

  const isDirty = useMemo(() => {
    if (!initialBrand) {
      return Boolean(
        name.trim() ||
          descriptionUz.trim() ||
          logoUrl.trim() ||
          coverUrl.trim() ||
          website.trim() ||
          instagram.trim() ||
          locations.length > 0
      );
    }
    return currentSnapshot !== initialSnapshotRef.current;
  }, [initialBrand, currentSnapshot, name, descriptionUz, logoUrl, coverUrl, website, instagram, locations.length]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

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
    } catch {
      toast({ title: 'Logo yuklashda xatolik yuz berdi', variant: 'destructive' });
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
    } catch {
      toast({ title: 'Slayd rasmini yuklashda xatolik yuz berdi', variant: 'destructive' });
    } finally {
      setUploadingCover(false);
    }
  };

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
    if (!name.trim() || !isDirty) return;
    setSaving(true);
    try {
      const cleanSlug =
        (initialBrand?.id || name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'brand-' + Date.now();

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

      initialSnapshotRef.current = currentSnapshot;
      onDirtyChange?.(false);
      if (saved && onSaved) onSaved(saved);
    } catch (err) {
      toast({
        title: 'Brendni saqlashda xatolik yuz berdi',
        description: err?.message || 'Qaytadan urinib ko‘ring',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-[#08123A] outline-none focus:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-400';

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-md backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[17px] font-extrabold text-[#08123A] dark:text-white">
              {initialBrand ? `${initialBrand.name} — Tahrirlash` : 'Yangi hamkor brend qo‘shish'}
            </h3>
            {isDirty && (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10.5px] font-extrabold text-amber-700 dark:text-amber-300">
                Saqlanmagan
              </span>
            )}
          </div>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Brend nomi, logosi, slayd rasmi, ijtimoiy tarmoqlar va xarita joylashuvini kiriting
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[12px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Bekor qilish
          </button>
        )}
      </div>

      {/* 1. BREND NOMI */}
      <div>
        <label className="mb-1 block text-[11.5px] font-bold text-slate-600 dark:text-slate-300">
          Brend nomi *
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Masalan: Żabka, EVOS yoki Cambridge"
          className={cn(inputCls, 'py-2.5 text-[13.5px] font-bold')}
        />
      </div>

      {/* 2. BREND LOGOSI VA SLAYD RASMI */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50 md:col-span-5">
          <label className="mb-2 block text-[11.5px] font-extrabold text-[#08123A] dark:text-white">
            1. Brend logosi (Oq kvadratda chiqadi)
          </label>
          <div className="flex items-center gap-3">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
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
                className={cn(inputCls, 'py-1.5 text-[11px]')}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50 md:col-span-7">
          <label className="mb-2 block text-[11.5px] font-extrabold text-[#08123A] dark:text-white">
            2. Slayd va muqova rasmi (Avtomatik moslanadi)
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 dark:border-slate-700 dark:bg-slate-800 sm:w-40">
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
                className={cn(inputCls, 'py-1.5 text-[11.5px]')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. KOMPANIYA HAQIDA QISQA MA'LUMOT */}
      <div>
        <label className="mb-1 block text-[11.5px] font-bold text-slate-600 dark:text-slate-300">
          Kompaniya / Brend haqida qisqa ma’lumot *
        </label>
        <textarea
          required
          rows={3}
          value={descriptionUz}
          onChange={(e) => setDescriptionUz(e.target.value)}
          placeholder="Kompaniya faoliyati va talabalar uchun qanday imkoniyatlar berishi haqida qisqacha yozing..."
          className={cn(inputCls, 'p-3 font-medium')}
        />
      </div>

      {/* 4. IJTIMOIY TARMOQLAR */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/45">
        <label className="mb-1 flex items-center gap-1.5 text-[12px] font-extrabold text-[#08123A] dark:text-white">
          <Globe className="h-4 w-4 text-[#1D6FF2] dark:text-sky-400" />
          Kompaniya veb-sayti va ijtimoiy tarmoqlari
        </label>
        <p className="mb-2.5 text-[11px] text-slate-500 dark:text-slate-400">
          Faqat siz to‘ldirgan tarmoqlar saytda ko‘rinadi
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="Veb-sayt (https://...)"
            className={inputCls}
          />
          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="Instagram link"
            className={inputCls}
          />
          <input
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder="Facebook link"
            className={inputCls}
          />
          <input
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            placeholder="TikTok link"
            className={inputCls}
          />
          <input
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="LinkedIn / Telegram"
            className={inputCls}
          />
        </div>
      </div>

      {/* 5. XARITA */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/45">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[13px] font-extrabold text-[#08123A] dark:text-white">
              <MapPin className="h-4 w-4 text-[#1D6FF2] dark:text-sky-400" />
              Ushbu brend va uning chegirmalari uchun xarita (Map) qo‘shasizmi?
            </p>
            <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
              «Yo‘q» desangiz, saytda chegirma ichida xarita ko‘rinmaydi
            </p>
          </div>

          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setHasMap(true)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-[12px] font-extrabold transition-all',
                hasMap
                  ? 'bg-[#002D96] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#08123A] dark:text-slate-300'
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
                  ? 'bg-slate-800 text-white shadow-sm dark:bg-slate-700'
                  : 'text-slate-600 hover:text-[#08123A] dark:text-slate-300'
              )}
            >
              Yo‘q (Xaritasiz)
            </button>
          </div>
        </div>

        {hasMap && (
          <div className="mt-4 space-y-3 border-t border-slate-200/70 pt-4 dark:border-slate-700">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
              <input
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="Filial nomi (masalan: Chilonzor filiali)"
                className={cn(inputCls, 'sm:col-span-4')}
              />
              <div className="flex gap-1.5 sm:col-span-5">
                <input
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="Manzilni yozing (masalan: Amir Temur 15)"
                  className={cn(inputCls, 'flex-1')}
                />
                <button
                  type="button"
                  onClick={handleFindOnMap}
                  disabled={searchingGeo}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-slate-200/80 px-3 py-2 text-[11.5px] font-bold text-[#08123A] hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
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
                  className={cn(inputCls, 'py-1 font-mono text-[11.5px]')}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400">Uzunlik (Lng)</label>
                <input
                  value={branchLng}
                  onChange={(e) => setBranchLng(e.target.value)}
                  className={cn(inputCls, 'py-1 font-mono text-[11.5px]')}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700">
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
                <p className="text-[11px] font-extrabold text-[#08123A] dark:text-white">
                  Qo‘shilgan filiallar ({locations.length}):
                </p>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {locations.map((loc) => (
                    <li
                      key={loc.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] dark:border-slate-700 dark:bg-slate-800"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-[#08123A] dark:text-white">
                          {loc.name}
                        </p>
                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {loc.address}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setLocations((prev) => prev.filter((item) => item.id !== loc.id))
                        }
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400"
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

      {/* 6. KATEGORIYALAR */}
      <div>
        <label className="mb-2 block text-[12px] font-extrabold text-[#08123A] dark:text-white">
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
                    ? 'border-[#002D96] bg-[#002D96] text-white shadow-sm dark:border-sky-400 dark:bg-[#1D6FF2]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
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
        disabled={saving || !isDirty}
        className="h-11 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-extrabold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-45"
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saqlanmoqda...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Saqlash
          </>
        )}
      </Button>
    </form>
  );
}
