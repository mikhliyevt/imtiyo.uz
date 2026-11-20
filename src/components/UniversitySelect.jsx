import { useMemo } from 'react';
import { Building2 } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { useLang } from '@/lib/LanguageContext';

export default function UniversitySelect({
  universities = [],
  value = '',
  onChange,
  disabled = false,
  placeholder,
  emptyPlaceholder,
  allowOther = true,
  otherLabel,
  allowClear = false,
  clearLabel,
  compact = false,
  showIcon = true,
  className = '',
}) {
  const langCtx = useLang();
  const t = langCtx?.t || ((k) => k);

  const options = useMemo(
    () =>
      (Array.isArray(universities) ? universities : [])
        .filter(Boolean)
        .map((u, idx) => {
          const name = typeof u === 'string' ? u : u.name || '';
          const shortName = typeof u === 'object' && u.short_name ? u.short_name : '';
          const region = typeof u === 'object' && u.region ? u.region : '';
          return {
            key: (typeof u === 'object' && u.id) || `${name}-${idx}`,
            value: name,
            label: name,
            badge: shortName,
            searchText: region,
          };
        })
        .filter((o) => o.value),
    [universities]
  );

  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
      searchable
      placeholder={placeholder || t('select.universityPlaceholder')}
      emptyPlaceholder={emptyPlaceholder || t('select.chooseRegionFirst')}
      searchPlaceholder={t('select.universitySearch')}
      emptyResultText={t('select.universityEmpty')}
      countSuffix={t('select.universityCount')}
      allowOther={allowOther}
      otherValue="Boshqa"
      otherLabel={otherLabel || t('select.otherUniversity')}
      allowClear={allowClear}
      clearLabel={clearLabel || t('select.allUniversities')}
      compact={compact}
      icon={showIcon ? Building2 : null}
      className={className}
    />
  );
}
