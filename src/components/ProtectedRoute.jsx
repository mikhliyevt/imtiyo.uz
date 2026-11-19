import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useStudent } from '@/lib/StudentContext';

export default function ProtectedRoute({ children }) {
  const { profile, loading } = useStudent();
  const location = useLocation();

  // Faqat dastlabki 1 soniya ichida loading bo'lsa spinner ko'rsatamiz,
  // profile allaqachon mavjud bo'lsa hech qachon qotib qolmaydi
  if (loading && !profile) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F5F8FF] dark:bg-[#070d1f]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#002D96]" />
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