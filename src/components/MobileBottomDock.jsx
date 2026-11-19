import { NavLink } from 'react-router-dom';
import { Compass, Home, MapPin, User } from 'lucide-react';

const MOBILE_DOCK_ITEMS = [
  { to: '/', icon: Home, label: 'Asosiy', end: true },
  { to: '/explore', icon: Compass, label: 'Chegirmalar', end: false },
  { to: '/map', icon: MapPin, label: 'Xarita', end: false },
  { to: '/profile', icon: User, label: 'Profil', end: false },
];

/**
 * Floating liquid-glass bottom dock strictly for mobile screens (md:hidden).
 * Adapted from Uiverse (mymiamo) to IMTIYO's brand color system.
 */
export default function MobileBottomDock() {
  return (
    <nav aria-label="Mobil navigatsiya" className="imtiyo-mobile-dock md:hidden">
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
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
