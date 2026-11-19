import { Navigate } from 'react-router-dom';
import { useStudent } from '@/lib/StudentContext';

export default function Settings() {
  const { profile, isLoadingStudent } = useStudent();

  if (!isLoadingStudent && !profile?.signedIn) {
    return <Navigate to="/welcome?mode=signin&returnTo=%2Fprofile%3Ftab%3Dsettings" replace />;
  }

  return <Navigate to="/profile?tab=settings" replace />;
}
