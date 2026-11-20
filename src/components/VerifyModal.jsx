import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  FileUp,
  GraduationCap,
  Loader2,
  Phone,
  Upload,
  User,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import RegionSelect from '@/components/RegionSelect';
import UniversitySelect from '@/components/UniversitySelect';
import SearchableSelect from '@/components/SearchableSelect';
import { useLang } from '@/lib/LanguageContext';
import { useStudent } from '@/lib/StudentContext';
import { useToast } from '@/components/ui/use-toast';
import { useScrollLock } from '@/lib/useScrollLock';
import { api, COURSE_OPTIONS, normalizeCourse } from '@/services/api';
import { formatBirthDateMask, formatUzPhone } from '@/lib/formUtils';
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
  const { t } = useLang();
  const { profile, submitVerification, updateProfile, reload } = useStudent();
  const { toast } = useToast();

  useScrollLock(open);

  const [universities, setUniversities] = useState([]);
  const [fullName, setFullName] = useState('');
  const [region, setRegion] = useState('');
  const [university, setUniversity] = useState('');
  const [customInstitution, setCustomInstitution] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [course, setCourse] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Track which extra profile fields were missing when the modal opened
  const [missingFields, setMissingFields] = useState({
    birth_date: false,
    gender: false,
    course: false,
    phone: false,
  });

  useEffect(() => {
    api.listUniversities().then((list) => setUniversities(list || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (open && profile) {
      setFullName(profile.name || '');
      setRegion(profile.region || '');
      setBirthDate(formatBirthDateMask(profile.birth_date || ''));
      setGender(profile.gender || '');
      setCourse(normalizeCourse(profile.course));
      setPhone(formatUzPhone(profile.phone || ''));
      setFile(null);

      setMissingFields({
        birth_date: !String(profile.birth_date || '').trim(),
        gender: !String(profile.gender || '').trim(),
        course: !normalizeCourse(profile.course),
        phone: String(profile.phone || '').replace(/\D/g, '').length < 9,
      });

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

  const genderOptions = useMemo(
    () => [
      { value: 'male', label: t('gender.male') },
      { value: 'female', label: t('gender.female') },
    ],
    [t]
  );

  const courseOptions = useMemo(
    () =>
      COURSE_OPTIONS.map((c) => ({
        value: c,
        label: `${c}${t('common.courseSuffix')}`,
      })),
    [t]
  );

  if (!open) return null;

  const hasAnyMissingExtra =
    missingFields.birth_date ||
    missingFields.gender ||
    missingFields.course ||
    missingFields.phone;

  const missingExtrasFilled =
    (!missingFields.birth_date || birthDate.trim().length === 10) &&
    (!missingFields.gender || Boolean(gender)) &&
    (!missingFields.course || COURSE_OPTIONS.includes(String(course))) &&
    (!missingFields.phone || phone.replace(/\D/g, '').length === 9);

  const isFormReady =
    fullName.trim().length >= 2 &&
    Boolean(region) &&
    Boolean(university) &&
    (university !== 'Boshqa' || customInstitution.trim().length >= 2) &&
    missingExtrasFilled;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      toast({ title: t('profile.fullName'), variant: 'destructive' });
      return;
    }
    if (!region) {
      toast({ title: t('select.regionPlaceholder'), variant: 'destructive' });
      return;
    }
    if (!university) {
      toast({ title: t('select.universityPlaceholder'), variant: 'destructive' });
      return;
    }
    if (university === 'Boshqa' && customInstitution.trim().length < 2) {
      toast({ title: t('select.customUniversityLabel'), variant: 'destructive' });
      return;
    }
    if (missingFields.birth_date && birthDate.trim().length !== 10) {
      toast({ title: t('profile.birthDateMask'), variant: 'destructive' });
      return;
    }
    if (missingFields.gender && !gender) {
      toast({ title: t('select.genderPlaceholder'), variant: 'destructive' });
      return;
    }
    if (missingFields.course && !COURSE_OPTIONS.includes(String(course))) {
      toast({ title: t('select.coursePlaceholder'), variant: 'destructive' });
      return;
    }
    if (missingFields.phone && phone.replace(/\D/g, '').length !== 9) {
      toast({ title: `${t('profile.phone')} (+998 99 999 99 99)`, variant: 'destructive' });
      return;
    }
    if (!file) {
      toast({
        title: t('verify.uploadPrompt'),
        description: t('verify.uploadTypes'),
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

      const phoneDigits = phone.replace(/\D/g, '').slice(-9);
      const profilePatch = {
        full_name: fullName.trim(),
        name: fullName.trim(),
        region,
        university: finalUniversity,
        ...(birthDate.trim() ? { birth_date: birthDate.trim() } : {}),
        ...(gender ? { gender } : {}),
        ...(course ? { course: String(course) } : {}),
        ...(phoneDigits.length === 9 ? { phone: `+998 ${formatUzPhone(phoneDigits)}` } : {}),
      };

      await updateProfile(profilePatch);

      await submitVerification({
        fullName: fullName.trim() || profile.name,
        university: finalUniversity,
        documentName: file.name,
        documentUrl: uploadedUrl,
        file,
      });

      await reload?.();
      toast({
        title: t('verify.success'),
        description: t('verify.successDesc'),
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: err.message || 'Error',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#08123A]/60 p-4 backdrop-blur-sm"
      onClick={() => !uploading && onOpenChange(false)}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-md space-y-3.5 overflow-y-auto overscroll-contain rounded-[28px] border border-slate-200/90 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[18px] font-extrabold text-[#08123A] dark:text-white">
              {t('verify.title')}
            </h3>
            <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
              {t('verify.modalSubtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t('common.close')}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* 1. F.I.O */}
          <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800">
            <User className="h-4 w-4 shrink-0 text-[#1D6FF2] dark:text-sky-400" />
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('profile.fullName')}
              className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none dark:text-white"
            />
          </div>

          {/* 2. VILOYAT TANLASH (UniversitySelect bilan bir xil dizayn) */}
          <RegionSelect
            value={region}
            onChange={(val) => {
              setRegion(val);
              setUniversity('');
              setCustomInstitution('');
            }}
            placeholder={t('select.regionPlaceholder')}
          />

          {/* 3. SHU VILOYATDAGI UNIVERSITETLAR RO'YXATI (QIDIRUVLI) + "BOSHQA" */}
          <UniversitySelect
            universities={filteredUniversities}
            value={university}
            disabled={!region}
            onChange={(val) => {
              setUniversity(val);
              if (val !== 'Boshqa') setCustomInstitution('');
            }}
          />

          {/* 4. AGAR "BOSHQA" TANLANSA */}
          {university === 'Boshqa' && (
            <div className="rounded-2xl border border-[#1D6FF2]/45 bg-[#1D6FF2]/[0.05] p-3 dark:border-sky-500/40 dark:bg-sky-500/10">
              <label className="mb-1 block text-[11px] font-extrabold text-[#002D96] dark:text-sky-300">
                {t('select.customUniversityLabel')}
              </label>
              <input
                required
                autoFocus
                value={customInstitution}
                onChange={(e) => setCustomInstitution(e.target.value)}
                placeholder={t('select.customUniversityPlaceholder')}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-[#08123A] outline-none focus:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* 5. KIRITILMAGAN QO'SHIMCHA PROFIL MA'LUMOTLARI (Tug'ilgan sana, jins, kurs, telefon) */}
          {hasAnyMissingExtra && (
            <div className="space-y-2.5 rounded-2xl border border-[#1D6FF2]/25 bg-[#1D6FF2]/[0.04] p-3.5 dark:border-sky-500/30 dark:bg-sky-500/10">
              <p className="text-[11.5px] font-extrabold text-[#002D96] dark:text-sky-300">
                {t('verify.missingInfoNotice')}
              </p>

              {missingFields.birth_date && (
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {t('profile.birthDateMask')} *
                  </label>
                  <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800">
                    <Calendar className="h-4 w-4 shrink-0 text-[#1D6FF2] dark:text-sky-400" />
                    <input
                      required
                      value={birthDate}
                      onChange={(e) => setBirthDate(formatBirthDateMask(e.target.value))}
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="05.07.2005"
                      className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none dark:text-white"
                    />
                  </div>
                </div>
              )}

              {(missingFields.gender || missingFields.course) && (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {missingFields.gender && (
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {t('profile.gender')} *
                      </label>
                      <SearchableSelect
                        options={genderOptions}
                        value={gender}
                        onChange={setGender}
                        searchable={false}
                        placeholder={t('select.genderPlaceholder')}
                        icon={User}
                      />
                    </div>
                  )}

                  {missingFields.course && (
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {t('profile.courseRange')} *
                      </label>
                      <SearchableSelect
                        options={courseOptions}
                        value={course}
                        onChange={setCourse}
                        searchable={false}
                        placeholder={t('select.coursePlaceholder')}
                        icon={GraduationCap}
                      />
                    </div>
                  )}
                </div>
              )}

              {missingFields.phone && (
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {t('profile.phone')} *
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800">
                    <Phone className="h-4 w-4 shrink-0 text-[#1D6FF2] dark:text-sky-400" />
                    <span className="text-[13px] font-extrabold text-[#002D96] dark:text-sky-400">
                      +998
                    </span>
                    <input
                      required
                      value={phone}
                      onChange={(e) => setPhone(formatUzPhone(e.target.value))}
                      inputMode="numeric"
                      placeholder="99 999 99 99"
                      className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. FAYL YUKLASH */}
          <label
            className={cn(
              'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-all',
              isFormReady
                ? 'cursor-pointer border-[#1D6FF2]/45 bg-[#1D6FF2]/[0.04] hover:bg-[#1D6FF2]/[0.08] dark:border-sky-500/40 dark:bg-sky-500/10 dark:hover:bg-sky-500/15'
                : 'cursor-not-allowed border-slate-200 bg-slate-100/70 opacity-55 dark:border-slate-700 dark:bg-slate-800/50'
            )}
          >
            {file ? (
              <>
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <p className="mt-1.5 max-w-full truncate text-[13px] font-extrabold text-[#08123A] dark:text-white">
                  {file.name}
                </p>
                <span className="mt-0.5 text-[11px] font-semibold text-[#1D6FF2] dark:text-sky-400">
                  {t('verify.uploadChange')}
                </span>
              </>
            ) : (
              <>
                <FileUp className="h-7 w-7 text-[#1D6FF2] dark:text-sky-400" />
                <p className="mt-1.5 text-[12.5px] font-extrabold text-[#08123A] dark:text-white">
                  {isFormReady ? t('verify.uploadPrompt') : t('verify.uploadFirstPick')}
                </p>
                <span className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {t('verify.uploadTypes')}
                </span>
              </>
            )}
            <input
              type="file"
              disabled={!isFormReady}
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
        </div>

        <Button
          type="submit"
          disabled={uploading || !isFormReady || !file}
          className="h-11 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[13px] font-bold text-white shadow-md disabled:opacity-45"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('verify.submitting')}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {t('verify.submit')}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
