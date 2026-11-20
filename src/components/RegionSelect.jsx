import { MapPin } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { REGIONS } from '@/lib/formUtils';
import { useLang } from '@/lib/LanguageContext';

export default function RegionSelect({
  value = '',
  onChange,
  disabled = false,
  placeholder,
  allowClear = false,
  clearLabel,
  compact = false,
  showIcon = true,
  className = '',
}) {
  const langCtx = useLang();
  const t = langCtx?.t || ((k) => k);

  return (
    <SearchableSelect
      options={REGIONS}
      value={value}
      onChange={onChange}
      disabled={disabled}
      searchable
      placeholder={placeholder || t('select.regionPlaceholder')}
      searchPlaceholder={t('select.regionSearch')}
      emptyResultText={t('select.regionEmpty')}
      countSuffix={t('select.regionCount')}
      allowClear={allowClear}
      clearLabel={clearLabel || t('select.allRegions')}
      allowOther={false}
      compact={compact}
      icon={showIcon ? MapPin : null}
      className={className}
    />
  );
}
