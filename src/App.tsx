import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import PasswordReset from "./pages/AuthPages/PasswordReset";
import AcceptInvitation from "./pages/AuthPages/AcceptInvitation";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import RoleManagement from "./pages/RoleManagement";
import UserManagement from "./pages/UserManagement";
import AdminInvitationsDemo from "./pages/AdminInvitationsDemo";
import EmployeeManagement from "./pages/EmployeeManagement";
import SkillManagement from "./pages/SkillManagement";
import SkillTypesManagement from "./pages/SkillTypesManagement";
import ClientManagement from "./pages/ClientManagement";
import ProjectManagement from "./pages/ProjectManagement";
import AllocationManagement from "./pages/AllocationManagement";
import CreateAllocation from "./pages/CreateAllocation";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AuthGuard from "./components/auth/AuthGuard";
import AppProviders from "./providers/AppProviders";

export default function App() {
  return (
    <AppProviders>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Protected Dashboard Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index path="/" element={<Home />} />

            {/* Main Pages */}
            <Route path="/employees" element={<EmployeeManagement />} />
            <Route path="/skills" element={<SkillManagement />} />
            <Route path="/clients" element={<ClientManagement />} />
            <Route path="/projects" element={<ProjectManagement />} />
            <Route path="/allocations" element={<AllocationManagement />} />
            <Route path="/allocations/create" element={<CreateAllocation />} />

            {/* Admin Pages */}
            <Route
              path="/admin/invitations"
              element={<AdminInvitationsDemo />}
            />
            <Route path="/admin/roles" element={<RoleManagement />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route
              path="/admin/skill-types"
              element={<SkillTypesManagement />}
            />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Public Auth Routes - Only accessible when NOT authenticated */}
          <Route
            path="/signin"
            element={
              <AuthGuard>
                <SignIn />
              </AuthGuard>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <AuthGuard>
                <ForgotPassword />
              </AuthGuard>
            }
          />
          <Route
            path="/reset-password"
            element={
              <AuthGuard>
                <PasswordReset />
              </AuthGuard>
            }
          />

          {/* Public Invitation Route - Accessible without authentication */}
          <Route path="/accept-invitation" element={<AcceptInvitation />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AppProviders>
  );
}
