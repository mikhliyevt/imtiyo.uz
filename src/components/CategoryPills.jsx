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
import { api, DEFAULT_CATEGORIES } from '@/services/api';
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
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  const activeVal = selected !== undefined ? selected : value;
  const handleSelect = onSelect || onChange || (() => {});

  useEffect(() => {
    const load = () => {
      api
        .listCategories()
        .then((list) => {
          if (Array.isArray(list) && list.length > 0) setCategories(list);
        })
        .catch(() => {});
    };
    load();
    window.addEventListener('imtiyo_categories_changed', load);
    return () => window.removeEventListener('imtiyo_categories_changed', load);
  }, []);

  const getLabel = (cat) => {
    if (lang === 'ru' && cat.label_ru) return cat.label_ru;
    if (lang === 'en' && cat.label_en) return cat.label_en;
    return cat.label_uz || cat.name || cat.id;
  };

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
              'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[12.5px] font-bold transition-all',
              active
                ? 'border-transparent bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white shadow-[0_10px_22px_-12px_rgba(0,45,150,0.85)]'
                : 'border-white/80 bg-white/85 text-slate-600 hover:border-[#1D6FF2]/40 hover:text-[#002D96]'
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