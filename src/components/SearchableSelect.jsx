import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';

export function normalizeSearchText(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/['`‘’ʻʼ]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Unified portal-based searchable select dropdown used across Regions, Universities,
 * Courses, etc. Renders its popover into document.body at z-[9999] so backdrop-filter
 * sibling cards or modal overflow containers NEVER clip or overlap the dropdown.
 */
export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  disabled = false,
  searchable = true,
  placeholder = '',
  emptyPlaceholder = '',
  searchPlaceholder = '',
  emptyResultText = '',
  countSuffix = '',
  allowClear = false,
  clearLabel = '',
  allowOther = false,
  otherValue = 'Boshqa',
  otherLabel = '',
  compact = false,
  icon: IconComponent = null,
  className = '',
}) {
  const langCtx = useLang();
  const t = langCtx?.t || ((k) => k);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [menuStyle, setMenuStyle] = useState(null);

  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const searchInputRef = useRef(null);

  const resolvedPlaceholder = placeholder || t('select.placeholder');
  const resolvedEmptyPlaceholder = emptyPlaceholder || resolvedPlaceholder;
  const resolvedSearchPlaceholder = searchPlaceholder || t('select.searchPlaceholder');
  const resolvedEmptyResult = emptyResultText || t('select.noResults');
  const resolvedClearLabel = clearLabel || t('common.all');
  const resolvedOtherLabel = otherLabel || t('select.other');

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;
    const estimatedHeight = searchable ? 330 : 270;
    const spaceBelow = viewportH - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openUpward = spaceBelow < 210 && spaceAbove > spaceBelow;

    const width = Math.min(Math.max(rect.width, 220), viewportW - 16);
    const left = Math.min(Math.max(8, rect.left), viewportW - width - 8);

    if (openUpward) {
      setMenuStyle({
        position: 'fixed',
        left,
        width,
        bottom: viewportH - rect.top + 6,
        maxHeight: Math.min(estimatedHeight, Math.max(160, spaceAbove)),
      });
    } else {
      setMenuStyle({
        position: 'fixed',
        left,
        width,
        top: rect.bottom + 6,
        maxHeight: Math.min(estimatedHeight, Math.max(160, spaceBelow)),
      });
    }
  }, [searchable]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updatePosition();
    const onOutside = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        popoverRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    };
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    document.addEventListener('mousedown', onOutside);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
      document.removeEventListener('mousedown', onOutside);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (open) {
      setHighlightIdx(0);
      if (searchable) {
        const timer = window.setTimeout(() => {
          searchInputRef.current?.focus();
        }, 25);
        return () => window.clearTimeout(timer);
      }
    } else {
      setQuery('');
    }
  }, [open, searchable]);

  const normalizedOptions = useMemo(() => {
    return (Array.isArray(options) ? options : [])
      .filter((o) => o !== null && o !== undefined)
      .map((opt, idx) => {
        if (typeof opt === 'string') {
          return {
            key: `${opt}-${idx}`,
            value: opt,
            label: opt,
            badge: '',
            searchHaystack: normalizeSearchText(opt),
          };
        }
        const optVal = opt.value ?? opt.id ?? opt.name ?? '';
        const optLabel = opt.label ?? opt.name ?? String(optVal);
        const optBadge = opt.badge ?? opt.short_name ?? '';
        const extra = opt.searchText ?? opt.region ?? '';
        return {
          key: opt.key ?? opt.id ?? `${optVal}-${idx}`,
          value: String(optVal),
          label: String(optLabel),
          badge: String(optBadge || ''),
          searchHaystack: normalizeSearchText(`${optBadge} ${optLabel} ${extra}`),
        };
      })
      .filter((item) => item.label);
  }, [options]);

  const filteredOptions = useMemo(() => {
    if (!searchable) return normalizedOptions;
    const q = normalizeSearchText(query);
    if (!q) return normalizedOptions;
    const tokens = q.split(' ').filter(Boolean);
    return normalizedOptions.filter((item) =>
      tokens.every((tok) => item.searchHaystack.includes(tok))
    );
  }, [normalizedOptions, query, searchable]);

  const flatSelectable = useMemo(() => {
    const items = [];
    if (allowClear) {
      items.push({ key: '__clear__', value: '', label: resolvedClearLabel, isSpecial: true });
    }
    filteredOptions.forEach((item) => items.push(item));
    if (allowOther) {
      items.push({
        key: '__other__',
        value: otherValue,
        label: resolvedOtherLabel,
        isSpecial: true,
      });
    }
    return items;
  }, [allowClear, resolvedClearLabel, filteredOptions, allowOther, otherValue, resolvedOtherLabel]);

  const selectedLabel = useMemo(() => {
    if (!value) return '';
    if (allowOther && value === otherValue) return resolvedOtherLabel;
    const hit = normalizedOptions.find((item) => item.value === String(value));
    if (!hit) return String(value);
    return hit.badge ? `${hit.badge} — ${hit.label}` : hit.label;
  }, [value, allowOther, otherValue, resolvedOtherLabel, normalizedOptions]);

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
    <div className={cn('relative w-full', className)}>
      <button
        ref={triggerRef}
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
          {IconComponent && (
            <IconComponent className="h-4 w-4 shrink-0 text-[#1D6FF2] dark:text-sky-400" />
          )}
          <span
            className={cn(
              'truncate',
              !selectedLabel && 'font-medium text-slate-400 dark:text-slate-400'
            )}
          >
            {selectedLabel || (disabled ? resolvedEmptyPlaceholder : resolvedPlaceholder)}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-1">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label={t('common.clear')}
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

      {open &&
        menuStyle &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            onKeyDown={handleKeyDown}
            onMouseDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            style={menuStyle}
            className="z-[9999] flex flex-col overflow-hidden rounded-2xl border border-slate-200/95 bg-white shadow-[0_24px_60px_-14px_rgba(8,18,58,0.32)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_24px_60px_-14px_rgba(0,0,0,0.82)]"
          >
            {searchable && (
              <div className="shrink-0 border-b border-slate-100 p-2 dark:border-slate-800">
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
                    placeholder={resolvedSearchPlaceholder}
                    className="w-full bg-transparent text-[12.5px] font-semibold text-[#08123A] outline-none placeholder:font-medium placeholder:text-slate-400 dark:text-white"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        searchInputRef.current?.focus();
                      }}
                      aria-label={t('common.clear')}
                      className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-200/80 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {countSuffix && (
                  <div className="mt-1.5 flex items-center justify-between px-1 text-[10.5px] font-semibold text-slate-400">
                    <span>
                      {filteredOptions.length} {countSuffix}
                    </span>
                    {query && <span>«{query}»</span>}
                  </div>
                )}
              </div>
            )}

            <ul
              role="listbox"
              className="flex-1 overflow-y-auto overscroll-contain p-1.5"
            >
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
                    <span>{resolvedClearLabel}</span>
                    {!value && (
                      <Check className="h-4 w-4 shrink-0 text-[#1D6FF2] dark:text-sky-400" />
                    )}
                  </button>
                </li>
              )}

              {filteredOptions.length === 0 ? (
                <li className="px-3 py-5 text-center text-[12px] font-semibold text-slate-400">
                  {resolvedEmptyResult}
                </li>
              ) : (
                filteredOptions.map((item, idx) => {
                  const flatIndex = allowClear ? idx + 1 : idx;
                  const isSelected = String(value) === item.value;
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
                          {item.badge && (
                            <span className="mr-1.5 inline-block rounded bg-[#1D6FF2]/10 px-1.5 py-0.5 text-[10.5px] font-extrabold text-[#002D96] dark:bg-sky-500/15 dark:text-sky-300">
                              {item.badge}
                            </span>
                          )}
                          <span className="leading-snug">{item.label}</span>
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
                    onClick={() => handleSelect(otherValue)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] font-extrabold transition-colors',
                      value === otherValue
                        ? 'bg-[#1D6FF2]/15 text-[#002D96] dark:bg-sky-500/20 dark:text-sky-300'
                        : 'text-[#1D6FF2] hover:bg-[#1D6FF2]/8 dark:text-sky-400 dark:hover:bg-sky-500/10'
                    )}
                  >
                    <span>+ {resolvedOtherLabel}</span>
                    {value === otherValue && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                </li>
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}
