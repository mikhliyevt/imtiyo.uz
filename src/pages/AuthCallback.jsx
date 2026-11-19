import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OAUTH_RETURN_KEY, useStudent } from '@/lib/StudentContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { profile, loading } = useStudent();

  useEffect(() => {
    if (loading) return;
    let target = '/profile';
    try {
      const savedReturn = sessionStorage.getItem(OAUTH_RETURN_KEY);
      if (savedReturn && savedReturn.startsWith('/') && !savedReturn.startsWith('//')) {
        target = savedReturn;
      }
      sessionStorage.removeItem(OAUTH_RETURN_KEY);
    } catch {
      /* ignore */
    }

    if (profile?.signedIn) {
      navigate(target, { replace: true });
    } else {
      navigate('/welcome?mode=signin', { replace: true });
    }
  }, [loading, profile?.signedIn, navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#070d1f]">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#1D6FF2] dark:border-slate-700 dark:border-t-sky-400" />
      <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300">
        Google orqali tasdiqlanmoqda...
      </p>
    </div>
  );
}
