import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  FileUp,
  Loader2,
  MapPin,
  Upload,
  User,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudent } from '@/lib/StudentContext';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/services/api';
import { REGIONS } from '@/pages/Welcome';
import { cn } from '@/lib/utils';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function VerifyModal({ open, onOpenChange }) {
  const { profile, submitVerification, updateProfile, reload } = useStudent();
  const { toast } = useToast();

  const [universities, setUniversities] = useState([]);
  const [fullName, setFullName] = useState('');
  const [region, setRegion] = useState('');
  const [university, setUniversity] = useState('');
  const [customInstitution, setCustomInstitution] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.listUniversities().then((list) => setUniversities(list || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (open && profile) {
      setFullName(profile.name || '');
      setRegion(profile.region || '');
      setFile(null);

      const uniNames = universities.map((u) => (typeof u === 'string' ? u : u?.name || ''));
      const curUni = profile.university || '';

      if (curUni.startsWith('Boshqa - ')) {
        setUniversity('Boshqa');
        setCustomInstitution(curUni.replace('Boshqa - ', ''));
      } else if (curUni && uniNames.length > 0 && !uniNames.includes(curUni)) {
        setUniversity('Boshqa');
        setCustomInstitution(curUni);
      } else {
        setUniversity(curUni);
        setCustomInstitution('');
      }
    }
  }, [open, profile, universities]);

  const filteredUniversities = useMemo(() => {
    const norm = (r) =>
      String(r || '')
        .toLowerCase()
        .replace(/viloyati|shahri|respublikasi/g, '')
        .trim();
    const selectedNorm = norm(region);

    return [...universities]
      .filter(Boolean)
      .filter((u) => {
        if (typeof u === 'string') return true;
        if (!region || !u.region) return true;
        return u.region === region || norm(u.region) === selectedNorm;
      })
      .sort((a, b) => {
        const nameA = typeof a === 'string' ? a : a?.name || '';
        const nameB = typeof b === 'string' ? b : b?.name || '';
        return String(nameA).localeCompare(String(nameB), 'uz');
      });
  }, [universities, region]);

  if (!open) return null;

  // Muassasa to'liq tanlangan yoki yozilganligini tekshirish
  const isInstitutionReady =
    Boolean(region) &&
    Boolean(university) &&
    (university !== 'Boshqa' || customInstitution.trim().length >= 2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!region) {
      toast({ title: 'Avval viloyatingizni tanlang', variant: 'destructive' });
      return;
    }
    if (!university) {
      toast({ title: 'Oliy ta’lim muassasangizni tanlang', variant: 'destructive' });
      return;
    }
    if (university === 'Boshqa' && customInstitution.trim().length < 2) {
      toast({ title: 'Ta’lim muassasangiz nomini yozing', variant: 'destructive' });
      return;
    }
    if (!file) {
      toast({
        title: 'Tasdiqlovchi hujjatni tanlang',
        description: 'Talabalik guvohnomasi yoki HEMIS ma’lumotnomasini yuklang.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      let uploadedUrl = '';
      try {
        uploadedUrl = await api.uploadFile(file, 'docs');
      } catch {
        uploadedUrl = await fileToDataUrl(file);
      }

      const finalUniversity =
        university === 'Boshqa' ? customInstitution.trim() : university;

      await updateProfile({
        region,
        university: finalUniversity,
      });

      await submitVerification({
        fullName: fullName.trim() || profile.name,
        university: finalUniversity,
        documentName: file.name,
        documentUrl: uploadedUrl,
        file,
      });

      await reload?.();
      toast({
        title: 'Hujjatingiz muvaffaqiyatli yuborildi!',
        description: 'Statusingiz «Kutilmoqda» holatiga o‘tkazildi.',
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Yuklashda xatolik yuz berdi',
        description: err.message || 'Qaytadan urinib ko‘ring',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#08123A]/55 p-4 backdrop-blur-xs"
      onClick={() => !uploading && onOpenChange(false)}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-3.5 rounded-[28px] border border-white/80 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[18px] font-extrabold text-[#08123A]">
              Talabalikni tasdiqlash
            </h3>
            <p className="mt-0.5 text-[12px] text-slate-500">
              1) Viloyat va OTMni tanlang → 2) Guvohnoma yoki HEMIS faylini yuklang
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* 1. F.I.O */}
          <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
            <User className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ism va familiyangiz"
              className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none"
            />
          </div>

          {/* 2. VILOYAT TANLASH */}
          <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-[#1D6FF2]" />
            <select
              required
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                setUniversity('');
                setCustomInstitution('');
              }}
              className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none"
            >
              <option value="">1. Viloyatingizni tanlang *</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* 3. SHU VILOYATDAGI UNIVERSITETLAR RO'YXATI + "BOSHQA" */}
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 transition-opacity',
              region
                ? 'border-slate-200 bg-slate-50/70'
                : 'pointer-events-none border-slate-100 bg-slate-100/60 opacity-50'
            )}
          >
            <Building2 className="h-4 w-4 shrink-0 text-[#1D6FF2]" />
            <select
              required
              disabled={!region}
              value={university}
              onChange={(e) => {
                setUniversity(e.target.value);
                if (e.target.value !== 'Boshqa') setCustomInstitution('');
              }}
              className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none"
            >
              <option value="">
                {region
                  ? '2. Oliy ta’lim muassasangizni tanlang *'
                  : 'Avval viloyatni tanlang'}
              </option>
              {filteredUniversities.map((u, idx) => {
                const name = typeof u === 'string' ? u : u?.name || '';
                const shortName = typeof u === 'object' && u?.short_name ? u.short_name : '';
                return (
                  <option key={u?.id || `${name}-${idx}`} value={name}>
                    {shortName ? `${shortName} — ${name}` : name}
                  </option>
                );
              })}
              <option value="Boshqa">Boshqa (Ro‘yxatda yo‘q)</option>
            </select>
          </div>

          {/* 4. AGAR "BOSHQA" TANLANSA -> TA'LIM MUASSASANGIZ NOMINI YOZISH PANELI */}
          {university === 'Boshqa' && (
            <div className="rounded-2xl border border-[#1D6FF2]/45 bg-[#1D6FF2]/[0.04] p-3">
              <label className="mb-1 block text-[11px] font-extrabold text-[#002D96]">
                Ta’lim muassasangiz nomini kiriting *
              </label>
              <input
                required
                autoFocus
                value={customInstitution}
                onChange={(e) => setCustomInstitution(e.target.value)}
                placeholder="Masalan: Toshkent amaliy fanlar universiteti"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-[#08123A] outline-none focus:border-[#1D6FF2]"
              />
            </div>
          )}

          {/* 5. FAYL YUKLASH (FAQAT VILOYAT VA MUASSASA KIRITILGANDAN KEYIN OCHILADI) */}
          <label
            className={cn(
              'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-all',
              isInstitutionReady
                ? 'cursor-pointer border-[#1D6FF2]/45 bg-[#1D6FF2]/[0.04] hover:bg-[#1D6FF2]/[0.08]'
                : 'cursor-not-allowed border-slate-200 bg-slate-100/70 opacity-55'
            )}
          >
            {file ? (
              <>
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <p className="mt-1.5 max-w-full truncate text-[13px] font-extrabold text-[#08123A]">
                  {file.name}
                </p>
                <span className="mt-0.5 text-[11px] font-semibold text-[#1D6FF2]">
                  Boshqa fayl tanlash uchun bosing
                </span>
              </>
            ) : (
              <>
                <FileUp className="h-7 w-7 text-[#1D6FF2]" />
                <p className="mt-1.5 text-[12.5px] font-extrabold text-[#08123A]">
                  {isInstitutionReady
                    ? '3. Hujjat faylini tanlang (Rasm yoki PDF)'
                    : 'Fayl yuklash uchun avval yuqorida OTMni tanlang'}
                </p>
                <span className="mt-0.5 text-[11px] text-slate-500">
                  Talabalik guvohnomasi yoki HEMIS ma’lumotnomasi
                </span>
              </>
            )}
            <input
              type="file"
              disabled={!isInstitutionReady}
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
        </div>

        <Button
          type="submit"
          disabled={uploading || !isInstitutionReady || !file}
          className="h-11 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-bold text-white shadow-md disabled:opacity-45"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Yuborilmoqda...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Tasdiqlashga yuborish
            </>
          )}
        </Button>
      </form>
    </div>
  );
}