import React from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { IconSprite } from './components/Icon.jsx';
import { AuthProvider } from './lib/AuthContext.jsx';
import CookieConsent from './components/CookieConsent.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminLeadDetailPage from './pages/AdminLeadDetailPage.jsx';
import AdminSettingsPage from './pages/AdminSettingsPage.jsx';
import AdminAccountPage from './pages/AdminAccountPage.jsx';
import LegalPage from './pages/LegalPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { useCampaign } from './lib/campaign.js';

export default function App() {
  return (
    <BrowserRouter>
      <IconSprite />
      <AuthProvider>
        <ApplicationRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

function ApplicationRoutes() {
  const location = useLocation();
  const adminRoute = /^\/admin(?:\/|$)/.test(location.pathname);
  const { campaign } = useCampaign({ trackingAllowed: !adminRoute });
  const trackingEnabled = Boolean(!adminRoute && campaign.metaPixelEnabled && campaign.metaPixelId);

  return (
    <>
      <CookieConsent enabled={trackingEnabled} />
      <Routes>
        <Route path="/" element={<LandingPage campaign={campaign} />} />
        <Route path="/impressum" element={<LegalPage type="imprint" trackingEnabled={trackingEnabled} />} />
        <Route path="/datenschutz" element={<LegalPage type="privacy" trackingEnabled={trackingEnabled} />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="leads/:id" element={<AdminLeadDetailPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="account" element={<AdminAccountPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
