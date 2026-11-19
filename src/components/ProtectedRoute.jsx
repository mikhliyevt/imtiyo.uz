import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useStudent } from '@/lib/StudentContext';

export default function ProtectedRoute({ children }) {
  const { profile, loading } = useStudent();
  const location = useLocation();

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#070d1f]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#1D6FF2] dark:border-slate-700 dark:border-t-sky-400" />
        <p className="text-[12.5px] font-bold text-slate-500 dark:text-slate-400">
          Akkauntga kirilmoqda...
        </p>
      </div>
    );
  }

  const isSignedIn = Boolean(profile?.signedIn);

  if (!isSignedIn) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/welcome?mode=signin&returnTo=${returnTo}`} replace />;
  }

  return children ? children : <Outlet />;
}
