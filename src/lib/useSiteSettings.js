import { useEffect, useState } from 'react';
import { api, DEFAULT_SITE_SETTINGS, normalizeSiteSettings } from '@/services/api';

// 100% Supabase-backed shared in-memory state (localStorage ishlatilmaydi)
let sharedState = {
  settings: normalizeSiteSettings(DEFAULT_SITE_SETTINGS),
  loaded: false,
};
let initialFetchStarted = false;
const listeners = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn(sharedState));
}

async function fetchLatestSiteSettings(force = false) {
  try {
    const res = await api.getSiteSettings(force);
    sharedState = {
      settings: normalizeSiteSettings(res || DEFAULT_SITE_SETTINGS),
      loaded: true,
    };
  } catch {
    sharedState = { ...sharedState, loaded: true };
  }
  notifyListeners();
}

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

export function useSiteSettingsState() {
  const [state, setState] = useState(() => sharedState);

  useEffect(() => {
    listeners.add(setState);

    if (!initialFetchStarted) {
      initialFetchStarted = true;
      fetchLatestSiteSettings(true);
    } else if (sharedState !== state) {
      setState(sharedState);
    }

    const onChanged = () => {
      fetchLatestSiteSettings(true);
    };

    window.addEventListener('imtiyo_site_settings_changed', onChanged);
    return () => {
      listeners.delete(setState);
      window.removeEventListener('imtiyo_site_settings_changed', onChanged);
    };
  }, []);

  return state;
}

export function useSiteSettings() {
  return useSiteSettingsState().settings;
}
