import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Layouts
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Pages
import ChatWidget from "./components/ChatWidget";
import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import RouterDetail from "./pages/public/RouterDetail"; // [New] Product Showcase
import PlanDetail from "./pages/public/PlanDetail"; // [New] Plan Showcase
import AdminDash from "./pages/admin/AdminDash";
import ManageAreas from "./pages/admin/ManageAreas";
import ManagePlans from "./pages/admin/ManagePlans";
import ManageStaff from "./pages/admin/ManageStaff";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageRequests from "./pages/admin/ManageRequests";
import Inventory from "./pages/admin/Inventory";
import Finance from "./pages/admin/Finance";
import Broadcast from "./pages/admin/Broadcast";
import NetworkMap from "./pages/admin/NetworkMap";
import WorkloadMonitor from "./pages/admin/WorkloadMonitor";
import Reports from "./pages/admin/Reports";
import TechDash from "./pages/staff/TechDash";
import FieldDash from "./pages/staff/FieldDash";
import FieldRepairs from "./pages/staff/FieldRepairs";
import CustDash from "./pages/customer/CustDash";
import BillHistory from "./pages/customer/BillHistory";
import Support from "./pages/customer/Support";
import Profile from "./pages/customer/Profile";

// Role-based Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Intelligent Redirect based on Role
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'TECHNICAL_STAFF') return <Navigate to="/staff/tech" replace />;
    if (user.role === 'FIELD_STAFF') return <Navigate to="/staff/field" replace />;
    if (user.role === 'CUSTOMER') return <Navigate to="/customer" replace />;

    return <Navigate to="/" replace />;
  }

  return children;
};

import ForgotPassword from "./pages/public/ForgotPassword";
import ResetPassword from "./pages/public/ResetPassword";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/logout" element={<Navigate to="/login" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

          <Route path="/login" element={<AuthLayout />}>
            <Route index element={<Login />} />
          </Route>
          <Route path="/register" element={<Register />} />
          <Route path="/hardware/:id" element={<RouterDetail />} /> {/* [New] Product Showcase */}
          <Route path="/plans/:id" element={<PlanDetail />} /> {/* [New] Plan Showcase */}

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDash />} />
            <Route path="requests" element={<ManageRequests />} />
            <Route path="areas" element={<ManageAreas />} />
            <Route path="plans" element={<ManagePlans />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="staff" element={<ManageStaff />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="finance" element={<Finance />} />
            <Route path="broadcast" element={<Broadcast />} />
            <Route path="map" element={<NetworkMap />} />
            <Route path="workload" element={<WorkloadMonitor />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          {/* Technical Staff Routes */}
          <Route path="/staff/tech" element={
            <ProtectedRoute allowedRoles={['TECHNICAL_STAFF']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<TechDash />} />
          </Route>

          {/* Field Staff Routes */}
          <Route path="/staff/field" element={
            <ProtectedRoute allowedRoles={['FIELD_STAFF']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<FieldDash />} />
            <Route path="repairs" element={<FieldRepairs />} />
          </Route>

          {/* Customer Routes */}
          <Route path="/customer" element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<CustDash />} />
            <Route path="pay" element={<BillHistory />} />
            <Route path="support" element={<Support />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <ChatWidget />
      </BrowserRouter>
    </AuthProvider>
  );
}
