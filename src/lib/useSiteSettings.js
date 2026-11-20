import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export function normalizeSocialUrl(raw, type = 'web') {
  const val = String(raw || '').trim();
  if (!val) return '';
  if (/^https?:\/\//i.test(val)) return val;
  if (type === 'telegram') {
    const clean = val.replace(/^@/, '').replace(/^t\.me\//i, '');
    return `https://t.me/${clean}`;
  }
  if (type === 'instagram') {
    const clean = val.replace(/^@/, '').replace(/^(www\.)?instagram\.com\//i, '');
    return `https://instagram.com/${clean}`;
  }
  if (type === 'youtube') {
    const clean = val.replace(/^(www\.)?youtube\.com\//i, '');
    return `https://youtube.com/${clean.startsWith('@') ? clean : `@${clean}`}`;
  }
  return `https://${val}`;
}

export function formatTelegramHandle(raw) {
  const val = String(raw || '').trim();
  if (!val) return '';
  const match = val.match(/(?:t\.me\/|@)([A-Za-z0-9_]+)/i);
  if (match && match[1]) return `@${match[1]}`;
  return val;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState(() => api.getSiteSettingsSync());

  useEffect(() => {
    let active = true;
    api
      .getSiteSettings()
      .then((res) => {
        if (active && res) setSettings(res);
      })
      .catch(() => {});

    const syncFromStore = () => {
      setSettings(api.getSiteSettingsSync());
      api
        .getSiteSettings(true)
        .then((res) => {
          if (active && res) setSettings(res);
        })
        .catch(() => {});
    };

    const onStorage = (e) => {
      if (!e.key || e.key === 'imtiyo_site_settings_v1') {
        syncFromStore();
      }
    };

    window.addEventListener('imtiyo_site_settings_changed', syncFromStore);
    window.addEventListener('storage', onStorage);
    return () => {
      active = false;
      window.removeEventListener('imtiyo_site_settings_changed', syncFromStore);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return settings;
}
