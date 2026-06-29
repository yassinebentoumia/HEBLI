// ============================================================
// HEBLI – Ultra Luxury Smart Coffee Management Platform
// Main Application Entry Point
// ============================================================

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '@/contexts/AppContext';
import { I18nProvider } from '@/i18n/I18nProvider';
import LoadingScreen from '@/components/LoadingScreen';

// Lazy-loaded pages
import { lazy, Suspense } from 'react';

const Landing = lazy(() => import('@/pages/client/Landing'));
const Menu = lazy(() => import('@/pages/client/Menu'));
const TrackOrder = lazy(() => import('@/pages/client/TrackOrder'));
const Support = lazy(() => import('@/pages/client/Support'));
const StaffLogin = lazy(() => import('@/pages/staff/Login'));
const BaristaDashboard = lazy(() => import('@/pages/staff/BaristaDashboard'));
const CashierDashboard = lazy(() => import('@/pages/staff/CashierDashboard'));
const OwnerDashboard = lazy(() => import('@/pages/staff/OwnerDashboard'));
const CreateInvoice = lazy(() => import('@/pages/staff/CreateInvoice'));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-amber-400 animate-pulse"
              style={{
                width: '24px',
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
        <span className="text-xs tracking-[0.2em] text-white/30 uppercase">Loading</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <I18nProvider>
        <AppProvider>
          <LoadingScreen />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Client Portal */}
              <Route path="/" element={<Landing />} />
              <Route path="/client/menu" element={<Menu />} />
              <Route path="/client/track" element={<TrackOrder />} />
              <Route path="/client/support" element={<Support />} />

              {/* Staff Portal */}
              <Route path="/staff" element={<StaffLogin />} />
              <Route path="/barista" element={<BaristaDashboard />} />
            <Route path="/cashier" element={<CashierDashboard />} />
            <Route path="/cashier/invoice" element={<CreateInvoice />} />
            <Route path="/owner" element={<OwnerDashboard />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppProvider>
      </I18nProvider>
    </HashRouter>
  );
}
