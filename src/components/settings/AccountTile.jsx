import { useEffect, useMemo, useState } from 'react';
import { Check, CreditCard } from 'lucide-react';
import SettingsTile from '@/components/settings/SettingsTile';
import { useLang } from '@/lib/LanguageContext';
import { useStudent } from '@/lib/StudentContext';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/services/api';
import { REGIONS } from '@/pages/Welcome';

export default function AccountTile() {
  const { t } = useLang();
  const { toast } = useToast();
  const { profile, updateProfile } = useStudent();

  const [saving, setSaving] = useState(false);
  const [universities, setUniversities] = useState([]);

  const [fullName, setFullName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [gender, setGender] = useState(profile.gender || '');
  const [birthDate, setBirthDate] = useState(profile.birth_date || '');
  const [region, setRegion] = useState(profile.region || '');
  const [university, setUniversity] = useState(profile.university || '');
  const [customInstitution, setCustomInstitution] = useState('');

  useEffect(() => {
    api.listUniversities().then((list) => setUniversities(list || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setFullName(profile.name || '');
    setPhone(profile.phone || '');
    setGender(profile.gender || '');
    setBirthDate(profile.birth_date || '');
    setRegion(profile.region || '');

    const rawUni = profile.university || '';
    if (rawUni.startsWith('Boshqa - ')) {
      setUniversity('Boshqa');
      setCustomInstitution(rawUni.replace('Boshqa - ', ''));
    } else {
      setUniversity(rawUni);
      setCustomInstitution('');
    }
  }, [profile]);

  const filteredUniversities = useMemo(() => {
    const normalizeRegion = (r) =>
      String(r || '')
        .toLowerCase()
        .replace(/viloyati|shahri|respublikasi/g, '')
        .trim();
    const selectedNorm = normalizeRegion(region);

    return [...universities]
      .filter((u) => {
        if (typeof u === 'string') return true;
        if (!region || !u.region) return true;
        return u.region === region || normalizeRegion(u.region) === selectedNorm;
      })
      .sort((a, b) => {
        const nameA = typeof a === 'string' ? a : a.name || '';
        const nameB = typeof b === 'string' ? b : b.name || '';
        return nameA.localeCompare(nameB, 'uz');
      });
  }, [universities, region]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const finalUni =
        university === 'Boshqa'
          ? customInstitution.trim() || 'Boshqa'
          : university;

      const payload = {
        full_name: fullName.trim() || profile.name,
        name: fullName.trim() || profile.name,
        phone: phone.trim(),
        gender,
        birth_date: birthDate.trim(),
        region,
        university: finalUni,
      };

      await updateProfile(payload);
      toast({ title: 'Ma’lumotlar muvaffaqiyatli saqlandi!' });
    } catch {
      toast({ title: 'Saqlashda xatolik yuz berdi', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsTile icon={CreditCard} title={t('settings.account')} hint={t('settings.accountHint')}>
      <form onSubmit={handleSave} className="space-y-3">
        <label className="block rounded-2xl border border-white/80 bg-white px-3.5 py-2.5">
          <span className="mb-0.5 block text-[9.5px] font-bold uppercase tracking-wide text-slate-400">
            F.I.O
          </span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ism va familiyangiz"
            className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none placeholder:text-slate-300"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block rounded-2xl border border-white/80 bg-white px-3.5 py-2.5">
            <span className="mb-0.5 block text-[9.5px] font-bold uppercase tracking-wide text-slate-400">
              Jinsingiz
            </span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-transparent text-[12.5px] font-semibold text-[#08123A] outline-none"
            >
              <option value="">Tanlang</option>
              <option value="male">O‘g‘il bola</option>
              <option value="female">Qiz bola</option>
            </select>
          </label>

          <label className="block rounded-2xl border border-white/80 bg-white px-3.5 py-2.5">
            <span className="mb-0.5 block text-[9.5px] font-bold uppercase tracking-wide text-slate-400">
              Tug‘ilgan sana
            </span>
            <input
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              placeholder="KK.OO.YYYY"
              className="w-full bg-transparent text-[12.5px] font-semibold text-[#08123A] outline-none placeholder:text-slate-300"
            />
          </label>
        </div>

        <label className="block rounded-2xl border border-white/80 bg-white px-3.5 py-2.5">
          <span className="mb-0.5 block text-[9.5px] font-bold uppercase tracking-wide text-slate-400">
            Viloyat
          </span>
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              setUniversity('');
            }}
            className="w-full bg-transparent text-[12.5px] font-semibold text-[#08123A] outline-none"
          >
            <option value="">Viloyatni tanlang</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="block rounded-2xl border border-white/80 bg-white px-3.5 py-2.5">
          <span className="mb-0.5 block text-[9.5px] font-bold uppercase tracking-wide text-slate-400">
            Ta’lim muassasasi
          </span>
          <select
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="w-full bg-transparent text-[12.5px] font-semibold text-[#08123A] outline-none"
          >
            <option value="">Tanlang</option>
            {filteredUniversities.map((u) => {
              const name = typeof u === 'string' ? u : u.name;
              const shortName = typeof u === 'object' && u.short_name ? u.short_name : '';
              return (
                <option key={u.id || name} value={name}>
                  {shortName ? `${shortName} — ${name}` : name}
                </option>
              );
            })}
            <option value="Boshqa">Boshqa</option>
          </select>
        </label>

        {university === 'Boshqa' && (
          <label className="block rounded-2xl border border-[#1D6FF2]/40 bg-[#1D6FF2]/[0.03] px-3.5 py-2.5">
            <span className="mb-0.5 block text-[9.5px] font-bold uppercase tracking-wide text-[#002D96]">
              Ta'lim muassasangiz
            </span>
            <input
              value={customInstitution}
              onChange={(e) => setCustomInstitution(e.target.value)}
              placeholder="Ta'lim muassasangiz"
              className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none"
            />
          </label>
        )}

        <label className="block rounded-2xl border border-white/80 bg-white px-3.5 py-2.5">
          <span className="mb-0.5 block text-[9.5px] font-bold uppercase tracking-wide text-slate-400">
            {t('settings.phone')}
          </span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 90 123 45 67"
            className="w-full bg-transparent text-[13px] font-semibold text-[#08123A] outline-none placeholder:text-slate-300"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] py-2.5 text-[12px] font-bold text-white shadow-sm"
        >
          <Check className="h-3.5 w-3.5" />
          {saving ? 'Saqlanmoqda...' : 'Ma’lumotlarni saqlash'}
        </button>

        <div className="flex items-center justify-between rounded-2xl bg-slate-900/[0.04] px-3.5 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {t('settings.google')}
            </p>
            <p className="truncate text-[12px] font-semibold text-[#08123A]">
              {profile.provider === 'google' ? profile.email : t('settings.notConnected')}
            </p>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#002D96]">
            {profile.provider === 'google' ? t('settings.connected') : t('settings.notConnected')}
          </span>
        </div>
      </form>
    </SettingsTile>
  );
}