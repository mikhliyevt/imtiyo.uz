import { NavLink } from 'react-router-dom';
import { Compass, Home, MapPin, User } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

const MOBILE_DOCK_ITEMS = [
  { to: '/', icon: Home, labelKey: 'nav.home', end: true },
  { to: '/explore', icon: Compass, labelKey: 'nav.deals', end: false },
  { to: '/map', icon: MapPin, labelKey: 'nav.map', end: false },
  { to: '/profile', icon: User, labelKey: 'nav.profile', end: false },
];

export default function MobileBottomDock() {
  const { t } = useLang();

  return (
    <nav aria-label="Mobile navigation" className="imtiyo-mobile-dock md:hidden">
      {MOBILE_DOCK_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <Icon />
            <span>{t(item.labelKey)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
