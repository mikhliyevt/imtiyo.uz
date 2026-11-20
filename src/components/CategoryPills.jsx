import { useEffect, useState } from 'react';
import {
  BookOpen,
  Coffee,
  Dumbbell,
  Gamepad2,
  Gift,
  GraduationCap,
  Heart,
  Laptop,
  Music,
  Pizza,
  Scissors,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Utensils,
} from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

export const CATEGORY_ICON_MAP = {
  Sparkles,
  Utensils,
  Coffee,
  Dumbbell,
  Scissors,
  GraduationCap,
  ShoppingBag,
  Gamepad2,
  Pizza,
  Laptop,
  BookOpen,
  Gift,
  Music,
  Heart,
  Store,
  Tag,
};

export default function CategoryPills({ value = 'all', onChange, selected, onSelect }) {
  const { lang } = useLang();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeVal = selected !== undefined ? selected : value;
  const handleSelect = onSelect || onChange || (() => {});

  useEffect(() => {
    let active = true;
    const load = (force = false) => {
      api
        .listCategories(force)
        .then((list) => {
          if (active && Array.isArray(list)) setCategories(list);
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoading(false);
        });
    };
    load(false);
    const onChanged = () => load(true);
    window.addEventListener('imtiyo_categories_changed', onChanged);
    return () => {
      active = false;
      window.removeEventListener('imtiyo_categories_changed', onChanged);
    };
  }, []);

  const getLabel = (cat) => {
    if (lang === 'ru' && cat.label_ru) return cat.label_ru;
    if (lang === 'en' && cat.label_en) return cat.label_en;
    return cat.label_uz || cat.name || cat.id;
  };

  if (loading && categories.length === 0) {
    return (
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-slate-200/75 dark:bg-slate-800/80"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((cat) => {
        const Icon = CATEGORY_ICON_MAP[cat.icon] || Tag;
        const active = activeVal === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleSelect(cat.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-[12.5px] font-bold transition-all',
              active
                ? 'border-transparent bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white shadow-[0_10px_22px_-12px_rgba(0,45,150,0.85)]'
                : 'border-slate-200/80 bg-white/80 text-slate-700 backdrop-blur-md hover:border-[#1D6FF2]/45 hover:bg-white hover:text-[#002D96] dark:border-slate-700/70 dark:bg-slate-900/75 dark:text-slate-200 dark:hover:border-sky-400/50 dark:hover:bg-slate-800 dark:hover:text-sky-300'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{getLabel(cat)}</span>
          </button>
        );
      })}
    </div>
  );
}
