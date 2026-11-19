const isNode = typeof window === 'undefined';

const isClearAccessTokenRequested = () =>
  !isNode && new URLSearchParams(window.location.search).get('clear_access_token') === 'true';

const clearStoredAccessToken = () => {
  if (isNode) return;
  window.localStorage.removeItem('base44_access_token');
  window.localStorage.removeItem('token');
};

const getAppParams = () => {
  if (isClearAccessTokenRequested()) {
    clearStoredAccessToken();
  }
  return {
    appId: import.meta.env.VITE_APP_ID || 'imtiyo-web',
    token: !isNode ? window.localStorage.getItem('token') : null,
    functionsVersion:
      (!isNode && new URLSearchParams(window.location.search).get('functions_version')?.trim()) ||
      'v1',
    appBaseUrl: !isNode ? window.location.origin : '',
  };
};

export const appParams = {
  ...getAppParams(),
};