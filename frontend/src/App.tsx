import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';

// Pages
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { BaggageRegistrationPage } from './pages/BaggageRegistration/BaggageRegistrationPage';
import { BaggageTrackingPage } from './pages/BaggageTracking/BaggageTrackingPage';
import { BaggageHandlingPage } from './pages/BaggageHandling/BaggageHandlingPage';
import { RouteExplorerPage } from './pages/RouteExplorer/RouteExplorerPage';
import { ScanUpdatePage } from './pages/ScanUpdate/ScanUpdatePage';
import { FlightsPage } from './pages/Flights/FlightsPage';
import { HandlingPointsPage } from './pages/HandlingPoints/HandlingPointsPage';
import { ExceptionsPage } from './pages/Exceptions/ExceptionsPage';
import { AnalyticsPage } from './pages/Analytics/AnalyticsPage';
import { DatabaseCenterPage } from './pages/DatabaseCenter/DatabaseCenterPage';
import { AdministrationPage } from './pages/Administration/AdministrationPage';
import { SettingsPage } from './pages/Settings/SettingsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Redirect legacy /login route directly to the CARGOFLIGHT dashboard */}
          <Route path="/login" element={<Navigate to="/" replace />} />

          {/* Main Operational Application Shell - Directly Accessible */}
          <Route element={<AppShell />}>
            {/* 1. Dashboard (Default Route) */}
            <Route path="/" element={<DashboardPage />} />

            {/* 2. Flight Operations */}
            <Route path="/flights" element={<FlightsPage />} />

            {/* 3. Baggage Handling */}
            <Route path="/handling" element={<BaggageHandlingPage />} />

            {/* 4. Track Baggage */}
            <Route path="/tracking" element={<BaggageTrackingPage />} />
            <Route path="/track" element={<Navigate to="/tracking" replace />} />

            {/* 5. Route Optimization */}
            <Route path="/routes" element={<RouteExplorerPage />} />

            {/* 6. Terminal Management */}
            <Route path="/terminals" element={<HandlingPointsPage />} />
            <Route path="/handling-points" element={<HandlingPointsPage />} />

            {/* 7. Live Scan Events */}
            <Route path="/scans" element={<ScanUpdatePage />} />

            {/* 8. Analytics & Reports */}
            <Route path="/analytics" element={<AnalyticsPage />} />

            {/* 9. Distributed Databases */}
            <Route path="/database-center" element={<DatabaseCenterPage />} />
            <Route path="/databases" element={<Navigate to="/database-center" replace />} />

            {/* 10. Users & Roles */}
            <Route path="/admin" element={<AdministrationPage />} />

            {/* 11. Settings */}
            <Route path="/settings" element={<SettingsPage />} />

            {/* Retained Operational Consoles */}
            <Route path="/registration" element={<BaggageRegistrationPage />} />
            <Route path="/register" element={<Navigate to="/registration" replace />} />
            <Route path="/exceptions" element={<ExceptionsPage />} />
          </Route>

          {/* Fallback to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
