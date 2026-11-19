import { useState } from 'react';
import { Image as ImageIcon, Loader2, Plus, Star, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

export default function OfferForm({ brand, onSaved }) {
  const [titleUz, setTitleUz] = useState('');
  const [descriptionUz, setDescriptionUz] = useState('');
  const [termsUz, setTermsUz] = useState(
    '1. Chegirma faqat tasdiqlangan IMTIYO talabalari uchun amal qiladi.\n2. Kod faollashtirilgandan so‘ng 15 daqiqa ichida ishlatilishi lozim.'
  );
  const [redemptionType, setRedemptionType] = useState('qr');
  const [promoCode, setPromoCode] = useState('');
  const [validUntil, setValidUntil] = useState('31/12/2026');
  const [imageUrl, setImageUrl] = useState('');
  const [isBest, setIsBest] = useState(true);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleOfferImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const url = await api.uploadFile(file, 'offers', { maxWidth: 900, maxHeight: 650 });
      setImageUrl(url);
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titleUz.trim() || !brand) return;
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
        onSaved(created);
        setTitleUz('');
        setDescriptionUz('');
        setPromoCode('');
        setImageUrl('');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3.5 rounded-[24px] border border-white/85 bg-white p-5 shadow-xs"
    >
      <p className="text-[13.5px] font-extrabold text-[#002D96]">
        ➕ {brand?.name} uchun yangi chegirma qo‘shish
      </p>

      {/* 1. CHEGIRMA NOMI */}
      <div>
        <label className="mb-1 block text-[11px] font-bold text-slate-600">
          Chegirma nomi (Sarlavha) *
        </label>
        <input
          required
          value={titleUz}
          onChange={(e) => setTitleUz(e.target.value)}
          placeholder="Masalan: 30% talaba chegirmasi yoki Qahva 15 000 so‘m"
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-bold text-[#08123A] outline-none focus:border-[#1D6FF2]"
        />
      </div>

      {/* 2. ENG ZO'R CHEGIRMA SIFATIDA BELGILASH */}
      <button
        type="button"
        onClick={() => setIsBest((v) => !v)}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left text-[12px] font-extrabold transition-all',
          isBest
            ? 'border-amber-400 bg-amber-50/90 text-amber-900'
            : 'border-slate-200 bg-slate-50 text-slate-600'
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

      {/* 3. FOYDALANISH USULI VA AMAL QILISH MUDDATI */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-bold text-slate-600">
            Foydalanish usuli *
          </label>
          <select
            value={redemptionType}
            onChange={(e) => setRedemptionType(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-[#08123A] outline-none focus:border-[#1D6FF2]"
          >
            <option value="qr">Filialda (QR-kod / On-site)</option>
            <option value="app">Online (Promo-kod / Ilova)</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-bold text-slate-600">
            Amal qilish muddati
          </label>
          <input
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            placeholder="24/11/2026"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold outline-none focus:border-[#1D6FF2]"
          />
        </div>
      </div>

      {/* 4. MAXSUS KOD VA TAVSIF */}
      <div>
        <label className="mb-1 block text-[11px] font-bold text-slate-600">
          Maxsus Promo-kod yoki QR qiymati (ixtiyoriy — bo‘sh qolsa avtomatik yaratiladi)
        </label>
        <input
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          placeholder="Masalan: IMTIYO2026"
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-mono text-[12.5px] font-semibold outline-none focus:border-[#1D6FF2]"
        />
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-bold text-slate-600">
          Chegirma haqida batafsil tushuntirish (Chegirma ichiga kirganda chiqadi)
        </label>
        <textarea
          rows={2}
          value={descriptionUz}
          onChange={(e) => setDescriptionUz(e.target.value)}
          placeholder="Masalan: 400 ml qahva atigi 15 000 so‘m — latte, kapuchino yoki amerikano. Barcha filiallarda amal qiladi."
          className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-[12px] font-medium outline-none focus:border-[#1D6FF2]"
        />
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-bold text-slate-600">
          Foydalanish shartlari (Terms)
        </label>
        <textarea
          rows={2}
          value={termsUz}
          onChange={(e) => setTermsUz(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-[11.5px] font-medium outline-none focus:border-[#1D6FF2]"
        />
      </div>

      {/* 5. CHEGIRMA E'LON RASMI */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
        <label className="mb-2 block text-[11px] font-extrabold text-[#08123A]">
          Chegirma e’lon rasmi (pasti va o‘ng tomoni avtomatik blur bo‘ladi)
        </label>
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {imageUrl || brand?.cover_url ? (
              <>
                <img
                  src={imageUrl || brand?.cover_url}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-white to-transparent backdrop-blur-[1.5px]" />
              </>
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
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold outline-none"
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={saving}
        className="h-10 w-full rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-[12.5px] font-bold text-white"
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        {saving ? 'Qo‘shilmoqda...' : 'Chegirmani saqlash'}
      </Button>
    </form>
  );
}