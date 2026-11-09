import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/Home';
import { NoticesPage } from './pages/NoticesPage';
import { GuidelinesPage } from './pages/GuidelinesPage';
import { FeesPage } from './pages/FeesPage';
import { SchedulePage } from './pages/SchedulePage';
import { ContactPage } from './pages/ContactPage';
import { TrackApplicationPage } from './pages/TrackApplicationPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterWizardPage } from './pages/RegisterWizardPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { PaymentPortalPage } from './pages/PaymentPortalPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { VerifyCardPage } from './pages/VerifyCardPage';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen overflow-x-hidden w-full">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/notices" element={<NoticesPage />} />
            <Route path="/guidelines" element={<GuidelinesPage />} />
            <Route path="/fees" element={<FeesPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/track-application" element={<TrackApplicationPage />} />
            
            {/* Public Card Verification */}
            <Route path="/verify/:cardId" element={<VerifyCardPage />} />
            <Route path="/verify" element={<VerifyCardPage />} />

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterWizardPage />} />

            {/* Dashboards & Payment */}
            <Route path="/dashboard" element={<StudentDashboardPage />} />
            <Route path="/payment" element={<PaymentPortalPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
