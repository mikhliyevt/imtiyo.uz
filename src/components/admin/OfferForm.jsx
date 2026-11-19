import { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Loader2, Save, Star, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

const DEFAULT_TERMS =
  '1. Chegirma faqat tasdiqlangan IMTIYO talabalari uchun amal qiladi.\n2. Kod faollashtirilgandan so‘ng 15 daqiqa ichida ishlatilishi lozim.';

export default function OfferForm({ brand, onSaved, onDirtyChange }) {
  const { toast } = useToast();
  const [titleUz, setTitleUz] = useState('');
  const [descriptionUz, setDescriptionUz] = useState('');
  const [termsUz, setTermsUz] = useState(DEFAULT_TERMS);
  const [redemptionType, setRedemptionType] = useState('qr');
  const [promoCode, setPromoCode] = useState('');
  const [validUntil, setValidUntil] = useState('31/12/2026');
  const [imageUrl, setImageUrl] = useState('');
  const [isBest, setIsBest] = useState(true);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [saving, setSaving] = useState(false);

  const isDirty = useMemo(
    () =>
      Boolean(
        titleUz.trim() ||
          descriptionUz.trim() ||
          promoCode.trim() ||
          imageUrl.trim() ||
          termsUz.trim() !== DEFAULT_TERMS ||
          validUntil.trim() !== '31/12/2026' ||
          redemptionType !== 'qr'
      ),
    [titleUz, descriptionUz, promoCode, imageUrl, termsUz, validUntil, redemptionType]
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  const handleOfferImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const url = await api.uploadFile(file, 'offers', { maxWidth: 900, maxHeight: 650 });
      setImageUrl(url);
    } catch {
      toast({ title: 'Rasm yuklashda xatolik yuz berdi', variant: 'destructive' });
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titleUz.trim() || !brand || !isDirty) return;
    setSaving(true);
    try {
      const created = await api.createOffer({
        brand_id: brand.id,
        brand_name: brand.name,
        title_uz: titleUz.trim(),
        discount_label: titleUz.trim(),
        description_uz: descriptionUz.trim(),
        terms_uz: termsUz.trim(),
        redemption_type: redemptionType,
        promo_code: promoCode.trim(),
        valid_until: validUntil.trim() || '31/12/2026',
        image_url: imageUrl.trim() || brand.cover_url || '',
        is_best: isBest,
      });
      if (created && onSaved) {
        setTitleUz('');
        setDescriptionUz('');
        setPromoCode('');
        setImageUrl('');
        setTermsUz(DEFAULT_TERMS);
        setValidUntil('31/12/2026');
        setRedemptionType('qr');
        onDirtyChange?.(false);
        onSaved(created);
      }
    } catch (err) {
      toast({
        title: 'Chegirmani saqlashda xatolik yuz berdi',
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
      className="space-y-3.5 rounded-[24px] border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13.5px] font-extrabold text-[#002D96] dark:text-sky-400">
          ➕ {brand?.name} uchun yangi chegirma qo‘shish
        </p>
        {isDirty && (
          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-300">
            Saqlanmagan
          </span>
        )}
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
          Chegirma nomi (Sarlavha) *
        </label>
        <input
          required
          value={titleUz}
          onChange={(e) => setTitleUz(e.target.value)}
          placeholder="Masalan: 30% talaba chegirmasi yoki Qahva 15 000 so‘m"
          className={cn(inputCls, 'py-2.5 text-[13px] font-bold')}
        />
      </div>

      <button
        type="button"
        onClick={() => setIsBest((v) => !v)}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left text-[12px] font-extrabold transition-all',
          isBest
            ? 'border-amber-400 bg-amber-50/90 text-amber-900 dark:border-amber-500/50 dark:bg-amber-500/15 dark:text-amber-200'
            : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
        )}
      >
        <Star
          className={cn(
            'h-4 w-4 shrink-0',
            isBest ? 'fill-amber-400 text-amber-500' : 'text-slate-400'
          )}
        />
        <span>
          ⭐ Eng zo‘r chegirma (Brendning asosiy yorlig‘i va slaydi sifatida chiqsin)
        </span>
      </button>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
            Foydalanish usuli *
          </label>
          <select
            value={redemptionType}
            onChange={(e) => setRedemptionType(e.target.value)}
            className={inputCls}
          >
            <option value="qr">Filialda (QR-kod / On-site)</option>
            <option value="app">Online (Promo-kod / Ilova)</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
            Amal qilish muddati
          </label>
          <input
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            placeholder="24/11/2026"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
          Maxsus Promo-kod yoki QR qiymati (ixtiyoriy)
        </label>
        <input
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          placeholder="Masalan: IMTIYO2026"
          className={cn(inputCls, 'font-mono')}
        />
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
          Chegirma haqida batafsil tushuntirish
        </label>
        <textarea
          rows={2}
          value={descriptionUz}
          onChange={(e) => setDescriptionUz(e.target.value)}
          placeholder="Masalan: 400 ml qahva atigi 15 000 so‘m — barcha filiallarda amal qiladi."
          className={cn(inputCls, 'p-2.5 text-[12px] font-medium')}
        />
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
          Foydalanish shartlari (Terms)
        </label>
        <textarea
          rows={2}
          value={termsUz}
          onChange={(e) => setTermsUz(e.target.value)}
          className={cn(inputCls, 'p-2.5 text-[11.5px] font-medium')}
        />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
        <label className="mb-2 block text-[11px] font-extrabold text-[#08123A] dark:text-white">
          Chegirma e’lon rasmi
        </label>
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            {imageUrl || brand?.cover_url ? (
              <img
                src={imageUrl || brand?.cover_url}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1.5">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#002D96] px-3.5 py-1.5 text-[11.5px] font-bold text-white hover:bg-[#1D6FF2]">
              {uploadingImg ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              <span>E’lon rasmini yuklash</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleOfferImageUpload}
                className="hidden"
              />
            </label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Yoki rasm URL..."
              className={cn(inputCls, 'py-1 text-[11px]')}
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={saving || !isDirty || !titleUz.trim()}
        className="h-10 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[12.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
      >
        {saving ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            Saqlanmoqda...
          </>
        ) : (
          <>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Saqlash
          </>
        )}
      </Button>
    </form>
  );
}
