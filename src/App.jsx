import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from '@/components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LanguageProvider } from '@/lib/LanguageContext';
import { StudentProvider } from '@/lib/StudentContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import AiChatWidget from '@/components/AiChatWidget';
import TopMarqueeBanner from '@/components/TopMarqueeBanner';
import { PageRouteSkeleton } from '@/components/PageSkeleton';

// Eager load Home for instant first paint; lazy-load secondary & heavy routes
import Home from '@/pages/Home';
const BrandDetail = lazy(() => import('@/pages/BrandDetail'));
const MapPage = lazy(() => import('@/pages/MapPage'));
const Profile = lazy(() => import('@/pages/Profile'));
const Admin = lazy(() => import('@/pages/Admin'));
const Explore = lazy(() => import('@/pages/Explore'));
const Settings = lazy(() => import('@/pages/Settings'));
const Welcome = lazy(() => import('@/pages/Welcome'));
const About = lazy(() => import('@/pages/About'));
const Help = lazy(() => import('@/pages/Help'));
const Contact = lazy(() => import('@/pages/Contact'));
const Terms = lazy(() => import('@/pages/Terms'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const PageNotFound = lazy(() => import('@/lib/PageNotFound'));

function AppRoutes() {
  return (
    <>
      <TopMarqueeBanner />
      <Suspense fallback={<PageRouteSkeleton />}>
        <Routes>
          {/* Public routes — accessible without login */}
          <Route path="/" element={<Home />} />
          <Route path="/brand/:slug" element={<BrandDetail />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/about" element={<About />} />
          <Route path="/help" element={<Help />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          <Route path="/login" element={<Navigate to="/welcome?mode=signin" replace />} />
          <Route path="/register" element={<Navigate to="/welcome?mode=signup" replace />} />

          {/* Hierarchical Admin routes */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/*" element={<Admin />} />

          {/* Protected student routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Suspense>
      <AiChatWidget />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <LanguageProvider>
            <StudentProvider>
              <Router>
                <ScrollToTop />
                <AppRoutes />
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
