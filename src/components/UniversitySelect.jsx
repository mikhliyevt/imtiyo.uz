import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

function normalizeSearch(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/['`‘’ʻʼ]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export default function UniversitySelect({
  universities = [],
  value = '',
  onChange,
  disabled = false,
  placeholder = 'Ta’lim muassasangizni tanlang',
  emptyPlaceholder = 'Avval viloyatingizni tanlang',
  allowOther = true,
  otherLabel = 'Boshqa (Ro‘yxatda yo‘q)',
  allowClear = false,
  clearLabel = 'Barcha universitetlar',
  compact = false,
  showIcon = true,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);

  const rootRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const onOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setHighlightIdx(0);
      const timer = window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 25);
      return () => window.clearTimeout(timer);
    } else {
      setQuery('');
    }
  }, [open]);

  const normalizedList = useMemo(() => {
    return (Array.isArray(universities) ? universities : [])
      .filter(Boolean)
      .map((u, idx) => {
        const name = typeof u === 'string' ? u : u.name || '';
        const shortName = typeof u === 'object' && u.short_name ? u.short_name : '';
        const region = typeof u === 'object' && u.region ? u.region : '';
        const label = shortName ? `${shortName} — ${name}` : name;
        return {
          key: (typeof u === 'object' && u.id) || `${name}-${idx}`,
          value: name,
          name,
          shortName,
          region,
          label,
          searchHaystack: normalizeSearch(`${shortName} ${name} ${region}`),
        };
      })
      .filter((item) => item.name);
  }, [universities]);

  const filteredOptions = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return normalizedList;
    const tokens = q.split(' ').filter(Boolean);
    return normalizedList.filter((item) =>
      tokens.every((tok) => item.searchHaystack.includes(tok))
    );
  }, [normalizedList, query]);

  const flatSelectable = useMemo(() => {
    const items = [];
    if (allowClear) {
      items.push({ key: '__clear__', value: '', label: clearLabel, isSpecial: true });
    }
    filteredOptions.forEach((item) => items.push(item));
    if (allowOther) {
      items.push({
        key: '__other__',
        value: 'Boshqa',
        label: otherLabel,
        isSpecial: true,
      });
    }
    return items;
  }, [allowClear, clearLabel, filteredOptions, allowOther, otherLabel]);

  const selectedLabel = useMemo(() => {
    if (!value) return '';
    if (value === 'Boshqa') return otherLabel;
    const hit = normalizedList.find((u) => u.value === value);
    return hit ? hit.label : value;
  }, [value, normalizedList, otherLabel]);

  const handleSelect = (nextVal) => {
    onChange?.(nextVal);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, Math.max(flatSelectable.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flatSelectable[highlightIdx]) {
      e.preventDefault();
      handleSelect(flatSelectable[highlightIdx].value);
    }
  };

  return (
    <div ref={rootRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'flex w-full items-center justify-between gap-2 text-left transition-colors outline-none',
          compact
            ? 'h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-[12px] font-semibold text-[#08123A] dark:border-slate-700 dark:bg-slate-800 dark:text-white'
            : 'rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#08123A] dark:border-slate-700 dark:bg-slate-800 dark:text-white',
          open && 'border-[#1D6FF2] ring-2 ring-[#1D6FF2]/15 dark:border-sky-400',
          disabled && 'cursor-not-allowed opacity-55'
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          {showIcon && (
            <Building2 className="h-4 w-4 shrink-0 text-[#1D6FF2] dark:text-sky-400" />
          )}
          <span
            className={cn(
              'truncate',
              !selectedLabel && 'font-medium text-slate-400 dark:text-slate-400'
            )}
          >
            {selectedLabel || (disabled ? emptyPlaceholder : placeholder)}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-1">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Tozalash"
              onClick={(e) => {
                e.stopPropagation();
                onChange?.('');
              }}
              className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-slate-400 transition-transform duration-200',
              open && 'rotate-180 text-[#1D6FF2] dark:text-sky-400'
            )}
          />
        </span>
      </button>

      {open && (
        <div
          onKeyDown={handleKeyDown}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-[60] overflow-hidden rounded-2xl border border-slate-200/95 bg-white shadow-[0_24px_60px_-14px_rgba(8,18,58,0.28)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_24px_60px_-14px_rgba(0,0,0,0.75)]"
        >
          {/* Qidiruv paneli */}
          <div className="border-b border-slate-100 p-2 dark:border-slate-800">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/90 px-2.5 py-2 focus-within:border-[#1D6FF2] focus-within:bg-white dark:border-slate-700 dark:bg-slate-800/90 dark:focus-within:border-sky-400 dark:focus-within:bg-slate-800">
              <Search className="h-4 w-4 shrink-0 text-[#1D6FF2] dark:text-sky-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlightIdx(0);
                }}
                placeholder="Universitet nomini qidiring (masalan: TATU, Milliy)..."
                className="w-full bg-transparent text-[12.5px] font-semibold text-[#08123A] outline-none placeholder:font-medium placeholder:text-slate-400 dark:text-white"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Qidiruvni tozalash"
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-200/80 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="mt-1.5 flex items-center justify-between px-1 text-[10.5px] font-semibold text-slate-400">
              <span>
                {filteredOptions.length} ta universitet topildi
              </span>
              {query && <span>«{query}»</span>}
            </div>
          </div>

          {/* Universitetlar ro'yxati */}
          <ul role="listbox" className="max-h-60 overflow-y-auto p-1.5">
            {allowClear && (
              <li>
                <button
                  type="button"
                  onClick={() => handleSelect('')}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] font-bold transition-colors',
                    !value
                      ? 'bg-[#1D6FF2]/12 text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300'
                      : 'text-slate-600 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800'
                  )}
                >
                  <span>{clearLabel}</span>
                  {!value && <Check className="h-4 w-4 shrink-0 text-[#1D6FF2] dark:text-sky-400" />}
                </button>
              </li>
            )}

            {filteredOptions.length === 0 ? (
              <li className="px-3 py-5 text-center text-[12px] font-semibold text-slate-400">
                Mos universitet topilmadi. Pastdan «Boshqa» ni tanlashingiz mumkin.
              </li>
            ) : (
              filteredOptions.map((item, idx) => {
                const flatIndex = allowClear ? idx + 1 : idx;
                const isSelected = value === item.value;
                const isHighlighted = highlightIdx === flatIndex;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlightIdx(flatIndex)}
                      onClick={() => handleSelect(item.value)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] transition-colors',
                        isSelected
                          ? 'bg-[#1D6FF2]/12 font-extrabold text-[#002D96] dark:bg-sky-500/20 dark:text-sky-300'
                          : isHighlighted
                            ? 'bg-slate-100 font-semibold text-[#08123A] dark:bg-slate-800 dark:text-white'
                            : 'font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/70'
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        {item.shortName && (
                          <span className="mr-1.5 inline-block rounded bg-[#1D6FF2]/10 px-1.5 py-0.5 text-[10.5px] font-extrabold text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300">
                            {item.shortName}
                          </span>
                        )}
                        <span className="leading-snug">{item.name}</span>
                      </span>
                      {isSelected && (
                        <Check className="h-4 w-4 shrink-0 text-[#1D6FF2] dark:text-sky-400" />
                      )}
                    </button>
                  </li>
                );
              })
            )}

            {allowOther && (
              <li className="mt-1 border-t border-slate-100 pt-1 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSelect('Boshqa')}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] font-extrabold transition-colors',
                    value === 'Boshqa'
                      ? 'bg-[#1D6FF2]/15 text-[#002D96] dark:bg-sky-500/20 dark:text-sky-300'
                      : 'text-[#1D6FF2] hover:bg-[#1D6FF2]/8 dark:text-sky-400 dark:hover:bg-sky-500/10'
                  )}
                >
                  <span>+ {otherLabel}</span>
                  {value === 'Boshqa' && <Check className="h-4 w-4 shrink-0" />}
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
