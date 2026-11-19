import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import { LanguageProvider } from '@/lib/LanguageContext';
import { StudentProvider } from '@/lib/StudentContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import AiChatWidget from '@/components/AiChatWidget';
import TopMarqueeBanner from '@/components/TopMarqueeBanner';

import Home from '@/pages/Home';
import BrandDetail from '@/pages/BrandDetail';
import MapPage from '@/pages/MapPage';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';
import Explore from '@/pages/Explore';
import Settings from '@/pages/Settings';
import Welcome from '@/pages/Welcome';
import About from '@/pages/About';
import Help from '@/pages/Help';
import Contact from '@/pages/Contact';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <>
      <TopMarqueeBanner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/brand/:slug" element={<BrandDetail />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/about" element={<About />} />
        <Route path="/help" element={<Help />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/login" element={<Navigate to="/welcome?mode=signin" replace />} />
        <Route path="/register" element={<Navigate to="/welcome?mode=signup" replace />} />

        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/deals" element={<Admin />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <AiChatWidget />
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <LanguageProvider>
            <StudentProvider>
              <Router>
                <ScrollToTop />
                <AuthenticatedApp />
              </Router>
            </StudentProvider>
          </LanguageProvider>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;