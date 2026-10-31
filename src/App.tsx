import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import LoginPage from './LoginPage';
import DashboardPage from './DashboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SiteLayout } from './site/components/SiteLayout';

const HomePage = lazy(() => import('./site/pages/HomePage'));
const AboutPage = lazy(() => import('./site/pages/AboutPage'));
const AcademicsPage = lazy(() => import('./site/pages/AcademicsPage'));
const AdmissionPage = lazy(() => import('./site/pages/AdmissionPage'));
const FacilitiesPage = lazy(() => import('./site/pages/FacilitiesPage'));
const TeachersPage = lazy(() => import('./site/pages/TeachersPage'));
const NoticesPage = lazy(() => import('./site/pages/NoticesPage'));
const GalleryPage = lazy(() => import('./site/pages/GalleryPage'));
const ContactPage = lazy(() => import('./site/pages/ContactPage'));

function PageFallback() {
  return (
    <div className="grid min-h-[46vh] place-items-center">
      <img src="/site/logo.webp" alt="" className="h-16 w-16 animate-pulse" />
    </div>
  );
}

function PublicPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

function PortalTitles() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname === '/login') document.title = 'Portal login · An-Noor International School';
    else if (pathname.startsWith('/dashboard')) document.title = 'Portal · An-Noor International School';
  }, [pathname]);
  return null;
}

function App() {
  return (
    <Router>
      <PortalTitles />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<PublicPage><HomePage /></PublicPage>} />
          <Route path="/about" element={<PublicPage><AboutPage /></PublicPage>} />
          <Route path="/academics" element={<PublicPage><AcademicsPage /></PublicPage>} />
          <Route path="/admission" element={<PublicPage><AdmissionPage /></PublicPage>} />
          <Route path="/facilities" element={<PublicPage><FacilitiesPage /></PublicPage>} />
          <Route path="/teachers" element={<PublicPage><TeachersPage /></PublicPage>} />
          <Route path="/notices" element={<PublicPage><NoticesPage /></PublicPage>} />
          <Route path="/gallery" element={<PublicPage><GalleryPage /></PublicPage>} />
          <Route path="/contact" element={<PublicPage><ContactPage /></PublicPage>} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
