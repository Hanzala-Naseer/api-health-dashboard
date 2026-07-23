import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import Landing from './pages/Landing/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import VerifyOtp from './pages/Auth/VerifyOtp';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import DashboardOverview from './pages/Dashboard/DashboardOverview';
import EndpointsList from './pages/Endpoints/EndpointsList';
import AddEditEndpoint from './pages/Endpoints/AddEditEndpoint';
import EndpointDetails from './pages/EndpointDetails/EndpointDetails';
import Alerts from './pages/Alerts/Alerts';
import MonitoringHistory from './pages/History/MonitoringHistory';
import Settings from './pages/Settings/Settings';
import NotFound from './pages/NotFound/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#282a32',
              color: '#e6e8f0',
              border: '1px solid #383b48',
            },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardOverview />} />
              <Route path="/dashboard/endpoints" element={<EndpointsList />} />
              <Route path="/dashboard/endpoints/new" element={<AddEditEndpoint />} />
              <Route path="/dashboard/endpoints/:id" element={<EndpointDetails />} />
              <Route path="/dashboard/endpoints/:id/edit" element={<AddEditEndpoint />} />
              <Route path="/dashboard/alerts" element={<Alerts />} />
              <Route path="/dashboard/history" element={<MonitoringHistory />} />
              <Route path="/dashboard/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
